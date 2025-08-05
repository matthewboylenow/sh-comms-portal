// app/api/announcements/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { getApprovalCoordinator } from '../../config/ministries';
import { getAirtableBaseSafe, getAirtableBase, TABLE_NAMES } from '../../lib/airtable';

export const dynamic = 'force-dynamic';

async function getMinistryByName(name: string) {
  try {
    const base = getAirtableBaseSafe();
    if (!base) {
      console.warn('Ministries base not configured, returning null');
      return null;
    }
    const records = await base(TABLE_NAMES.MINISTRIES)
      .select({
        filterByFormula: `LOWER({Name}) = LOWER("${name.replace(/"/g, '""')}")`,
        maxRecords: 1
      })
      .all();

    if (records.length > 0) {
      const record = records[0];
      return {
        id: record.id,
        name: record.fields.Name as string,
        requiresApproval: record.fields['Requires Approval'] === true,
        approvalCoordinator: record.fields['Approval Coordinator'] as string || 'adult-discipleship',
        description: record.fields.Description as string || '',
        active: record.fields.Active !== false
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching ministry:', error);
    return null;
  }
}

type AnnouncementFormData = {
  name: string;
  email: string;
  ministry?: string;
  eventDate?: string;
  eventTime?: string;
  promotionStart?: string;
  platforms?: string[]; // e.g. ["Email Blast", "Bulletin", "Church Screens"]
  announcementBody: string;
  addToCalendar?: boolean;
  isExternalEvent?: boolean;
  fileLinks?: string[];
};

// 1) Configure Airtable using centralized utility

// 2) Setup Microsoft Graph
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

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as AnnouncementFormData;
    console.log('Announcements form submission:', data);

    // Check if ministry requires approval
    const ministry = data.ministry ? await getMinistryByName(data.ministry) : null;
    const requiresApproval = ministry?.requiresApproval || false;
    const approvalStatus = requiresApproval ? 'pending' : 'approved';

    // 1) Write to Airtable
    const fileLinksString = data.fileLinks?.length ? data.fileLinks.join('\n') : '';
    const addToCalendarValue = data.addToCalendar ? 'Yes' : 'No';

    const base = getAirtableBase();
    const record = await base(TABLE_NAMES.ANNOUNCEMENTS).create([
      {
        fields: {
          Name: data.name,
          Email: data.email,
          Ministry: data.ministry || '',
          'Date of Event': data.eventDate || '',
          'Time of Event': data.eventTime || '',
          'Promotion Start Date': data.promotionStart || '',
          Platforms: data.platforms || [],
          'Announcement Body': data.announcementBody,
          'Add to Events Calendar': addToCalendarValue,
          'External Event': data.isExternalEvent ? 'Yes' : 'No',
          'File Links': fileLinksString,
          'Approval Status': approvalStatus,
          'Requires Approval': requiresApproval ? 'Yes' : 'No',
          'Ministry ID': ministry?.id || '',
          'Submitted At': new Date().toISOString(),
        },
      },
    ]);

    console.log('Airtable record created:', record);

    // 2) Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen Announcement Received';
    
    const approvalText = requiresApproval 
      ? `<p style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;"><strong>Approval Required:</strong> This announcement requires approval from the Coordinator of Adult Discipleship before being published. You will receive an email notification once it has been reviewed.</p>`
      : `<p style="background-color: #d1fae5; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981;"><strong>Status:</strong> Your announcement has been received and will be processed by our communications team.</p>`;

    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your announcement request:</p>
      <ul>
        <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
        <li><strong>Event Date:</strong> ${data.eventDate || 'N/A'} ${data.eventTime || ''}</li>
        <li><strong>Promotion Start:</strong> ${data.promotionStart || 'N/A'}</li>
        <li><strong>Add to Calendar:</strong> ${addToCalendarValue}</li>
        <li><strong>External Event:</strong> ${data.isExternalEvent ? 'Yes' : 'No'}</li>
        <li><strong>File Links:</strong><br/>${fileLinksString.replace(/\n/g, '<br/>')}</li>
      </ul>
      ${approvalText}
      <p>Thank you!</p>
      <p>Saint Helen Communications</p>
    `;

    const sendMailResponse = await client.api(`/users/${fromAddress}/sendMail`).post({
      message: {
        subject,
        body: { contentType: 'html', content: htmlContent },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [
          { emailAddress: { address: data.email } },
        ],
      },
      saveToSentItems: true,
    });

    console.log('Email sent via MS Graph:', sendMailResponse);

    // 3) Send notification to approval coordinator if required
    if (requiresApproval && ministry?.approvalCoordinator) {
      const coordinator = getApprovalCoordinator(ministry.approvalCoordinator);
      if (coordinator?.email) {
        const coordinatorSubject = 'Adult Discipleship Announcement Requires Approval';
        const coordinatorHtmlContent = `
          <p>Hello,</p>
          <p>A new announcement submission requires your approval:</p>
          <ul>
            <li><strong>Submitted by:</strong> ${data.name} (${data.email})</li>
            <li><strong>Ministry:</strong> ${data.ministry}</li>
            <li><strong>Event Date:</strong> ${data.eventDate || 'N/A'} ${data.eventTime || ''}</li>
            <li><strong>Promotion Start:</strong> ${data.promotionStart || 'N/A'}</li>
            <li><strong>External Event:</strong> ${data.isExternalEvent ? 'Yes' : 'No'}</li>
          </ul>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <h4>Announcement Body:</h4>
            <p>${data.announcementBody.replace(/\n/g, '<br/>')}</p>
          </div>
          ${fileLinksString ? `<p><strong>Attached Files:</strong><br/>${fileLinksString.replace(/\n/g, '<br/>')}</p>` : ''}
          <p>Please review this submission in the admin portal to approve or reject it.</p>
          <p>Saint Helen Communications Portal</p>
        `;

        await client.api(`/users/${fromAddress}/sendMail`).post({
          message: {
            subject: coordinatorSubject,
            body: { contentType: 'html', content: coordinatorHtmlContent },
            from: { emailAddress: { address: fromAddress } },
            toRecipients: [
              { emailAddress: { address: coordinator.email } },
            ],
          },
          saveToSentItems: true,
        });

        console.log('Approval notification sent to coordinator:', coordinator.email);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Announcements submission error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Submission failed' }),
      { status: 500 }
    );
  }
}