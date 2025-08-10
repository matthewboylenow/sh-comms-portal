import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { getAirtableBase, TABLE_NAMES } from '../../../lib/airtable';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserApprovalScope, getUserPermissions } from '../../../config/permissions';

export const dynamic = 'force-dynamic';

function getGraphClient() {
  const tenantId = process.env.AZURE_AD_TENANT_ID || '';
  const clientId = process.env.AZURE_AD_CLIENT_ID || '';
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET || '';

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({
    debugLogging: false,
    authProvider,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    const permissions = getUserPermissions(session.user.email);
    if (!permissions.canAccessApprovals) {
      return new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const base = getAirtableBase();
    
    // Build filter formula based on user's approval scope
    let filterFormula = `{Approval Status} = "${status}"`;
    
    const approvalScope = getUserApprovalScope(session.user.email);
    if (approvalScope && approvalScope.length > 0) {
      // Adult Faith approvers can only see their ministries
      const ministryFilter = approvalScope.map(ministry => 
        `{Ministry} = "${ministry}"`
      ).join(', ');
      filterFormula = `AND({Approval Status} = "${status}", OR(${ministryFilter}))`;
    }

    const records = await base(TABLE_NAMES.ANNOUNCEMENTS)
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: 'Submitted At', direction: 'desc' }]
      })
      .all();

    const pendingApprovals = records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      email: record.fields.Email,
      ministry: record.fields.Ministry,
      eventDate: record.fields['Date of Event'],
      eventTime: record.fields['Time of Event'],
      promotionStart: record.fields['Promotion Start Date'],
      platforms: record.fields.Platforms,
      announcementBody: record.fields['Announcement Body'],
      addToCalendar: record.fields['Add to Events Calendar'],
      fileLinks: record.fields['File Links'],
      approvalStatus: record.fields['Approval Status'],
      requiresApproval: record.fields['Requires Approval'],
      ministryId: record.fields['Ministry ID'],
      submittedAt: record.fields['Submitted At'],
      approvedBy: record.fields['Approved By'],
      approvedAt: record.fields['Approved At'],
      rejectionReason: record.fields['Rejection Reason']
    }));

    return NextResponse.json({ approvals: pendingApprovals });
  } catch (error: any) {
    console.error('Error fetching approvals:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to fetch approvals' }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    const permissions = getUserPermissions(session.user.email);
    if (!permissions.canAccessApprovals) {
      return new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Handle bulk operations
    if (body.bulk && body.recordIds) {
      return handleBulkApproval(body, session.user.email, permissions);
    }
    
    // Handle single approval
    const { recordId, action, rejectionReason } = body;

    if (!recordId || !action) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return new NextResponse(
        JSON.stringify({ error: 'Rejection reason is required' }),
        { status: 400 }
      );
    }

    // Get the current record to send notification
    const base = getAirtableBase();
    const currentRecord = await base(TABLE_NAMES.ANNOUNCEMENTS).find(recordId);
    const submitterEmail = currentRecord.fields.Email as string;
    const submitterName = currentRecord.fields.Name as string;
    const ministry = currentRecord.fields.Ministry as string;
    
    // Verify user has permission to approve this ministry
    const approvalScope = getUserApprovalScope(session.user.email);
    if (approvalScope && !approvalScope.includes(ministry)) {
      return new NextResponse(
        JSON.stringify({ error: 'You do not have permission to approve this ministry' }),
        { status: 403 }
      );
    }

    // Update the record
    const updateFields: any = {
      'Approval Status': action === 'approve' ? 'approved' : 'rejected',
      'Approved By': session.user.email,
    };

    if (action === 'reject') {
      updateFields['Rejection Reason'] = rejectionReason;
    }

    await base(TABLE_NAMES.ANNOUNCEMENTS).update([
      {
        id: recordId,
        fields: updateFields
      }
    ]);

    // Send notification email to submitter
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    
    const subject = action === 'approve' 
      ? 'Saint Helen Announcement Approved'
      : 'Saint Helen Announcement - Update Required';

    const htmlContent = action === 'approve' 
      ? `
        <p>Hello ${submitterName},</p>
        <p>Great news! Your announcement for <strong>${ministry}</strong> has been approved by the Coordinator of Adult Discipleship.</p>
        <p>Your announcement will now be processed by our communications team and published according to your requested timeline.</p>
        <p>Thank you for your submission!</p>
        <p>Saint Helen Communications</p>
      `
      : `
        <p>Hello ${submitterName},</p>
        <p>Thank you for your announcement submission for <strong>${ministry}</strong>.</p>
        <p>The Coordinator of Adult Discipleship has reviewed your submission and requests the following changes:</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 16px 0;">
          <p><strong>Feedback:</strong></p>
          <p>${rejectionReason}</p>
        </div>
        <p>Please feel free to resubmit your announcement with the requested changes through the communications portal.</p>
        <p>Thank you!</p>
        <p>Saint Helen Communications</p>
      `;

    await client.api(`/users/${fromAddress}/sendMail`).post({
      message: {
        subject,
        body: { contentType: 'html', content: htmlContent },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [
          { emailAddress: { address: submitterEmail } },
        ],
      },
      saveToSentItems: true,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Announcement ${action}d successfully and notification sent.` 
    });

  } catch (error: any) {
    console.error('Error processing approval:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to process approval' }),
      { status: 500 }
    );
  }
}

async function handleBulkApproval(
  body: { recordIds: string[]; action: string; rejectionReason?: string }, 
  userEmail: string, 
  permissions: any
) {
  try {
    const { recordIds, action, rejectionReason } = body;
    const base = getAirtableBase();
    const approvalScope = getUserApprovalScope(userEmail);
    
    // Get all records first to validate permissions
    const records = await Promise.all(
      recordIds.map(id => base(TABLE_NAMES.ANNOUNCEMENTS).find(id))
    );
    
    // Verify user has permission to approve all these ministries
    if (approvalScope) {
      for (const record of records) {
        const ministry = record.fields.Ministry as string;
        if (!approvalScope.includes(ministry)) {
          return new NextResponse(
            JSON.stringify({ error: `You do not have permission to approve ${ministry}` }),
            { status: 403 }
          );
        }
      }
    }
    
    // Prepare updates
    const updates = recordIds.map(recordId => ({
      id: recordId,
      fields: {
        'Approval Status': action === 'approve' ? 'approved' : 'rejected',
        'Approved By': userEmail,
        ...(action === 'reject' && rejectionReason ? { 'Rejection Reason': rejectionReason } : {})
      }
    }));
    
    // Batch update records
    await base(TABLE_NAMES.ANNOUNCEMENTS).update(updates);
    
    // Send notification emails
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    
    const emailPromises = records.map(async (record, index) => {
      const submitterEmail = record.fields.Email as string;
      const submitterName = record.fields.Name as string;
      const ministry = record.fields.Ministry as string;
      
      const subject = action === 'approve' 
        ? 'Saint Helen Announcement Approved'
        : 'Saint Helen Announcement - Update Required';

      const htmlContent = action === 'approve' 
        ? `
          <p>Hello ${submitterName},</p>
          <p>Great news! Your announcement for <strong>${ministry}</strong> has been approved by the Coordinator of Adult Discipleship.</p>
          <p>Your announcement will now be processed by our communications team and published according to your requested timeline.</p>
          <p>Thank you for your submission!</p>
          <p>Saint Helen Communications</p>
        `
        : `
          <p>Hello ${submitterName},</p>
          <p>Thank you for your announcement submission for <strong>${ministry}</strong>.</p>
          <p>The Coordinator of Adult Discipleship has reviewed your submission and requests the following changes:</p>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 16px 0;">
            <p><strong>Feedback:</strong></p>
            <p>${rejectionReason}</p>
          </div>
          <p>Please feel free to resubmit your announcement with the requested changes through the communications portal.</p>
          <p>Thank you!</p>
          <p>Saint Helen Communications</p>
        `;

      await client.api(`/users/${fromAddress}/sendMail`).post({
        message: {
          subject,
          body: { contentType: 'html', content: htmlContent },
          from: { emailAddress: { address: fromAddress } },
          toRecipients: [
            { emailAddress: { address: submitterEmail } },
          ],
        },
        saveToSentItems: true,
      });
    });
    
    await Promise.all(emailPromises);
    
    return NextResponse.json({ 
      success: true, 
      message: `${recordIds.length} announcements ${action}d successfully and notifications sent.`,
      processed: recordIds.length
    });
    
  } catch (error: any) {
    console.error('Error processing bulk approval:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to process bulk approval' }),
      { status: 500 }
    );
  }
}