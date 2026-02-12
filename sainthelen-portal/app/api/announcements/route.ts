// app/api/announcements/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { getApprovalCoordinator } from '../../config/ministries';
import { getAirtableBaseSafe, getAirtableBase, TABLE_NAMES } from '../../lib/airtable';

// New Neon database imports
import { useNeonDatabase } from '../../lib/db';
import { findMinistryByNameOrAlias } from '../../lib/db/services/ministries';
import { createAnnouncement } from '../../lib/db/services/announcements';

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
  signUpUrl?: string;
  publicationNotes?: string;
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

    // Check feature flag for database selection
    const useNeon = useNeonDatabase();
    const fileLinksString = data.fileLinks?.length ? data.fileLinks.join('\n') : '';

    let ministry: any = null;
    let requiresApproval = false;
    let approvalStatus = 'approved';

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      console.log('Using Neon PostgreSQL database');

      // Check if ministry requires approval using Neon
      if (data.ministry) {
        ministry = await findMinistryByNameOrAlias(data.ministry);
        requiresApproval = ministry?.requiresApproval || false;
        approvalStatus = requiresApproval ? 'pending' : 'approved';
      }

      // Create announcement in Neon
      const announcement = await createAnnouncement({
        name: data.name,
        email: data.email,
        ministry: data.ministry || null,
        ministryId: ministry?.id || null,
        announcementBody: data.announcementBody,
        dateOfEvent: data.eventDate || null,
        timeOfEvent: data.eventTime || null,
        promotionStartDate: data.promotionStart || null,
        platforms: data.platforms || null,
        addToEventsCalendar: data.addToCalendar || false,
        externalEvent: data.isExternalEvent || false,
        fileLinks: data.fileLinks || null,
        signUpUrl: data.signUpUrl || null,
        publicationNotes: data.publicationNotes || null,
        approvalStatus,
        requiresApproval,
      });

      console.log('Neon record created:', announcement.id);
    } else {
      // ===== AIRTABLE DATABASE PATH (Legacy) =====
      console.log('Using Airtable database');

      // Check if ministry requires approval
      ministry = data.ministry ? await getMinistryByName(data.ministry) : null;
      requiresApproval = ministry?.requiresApproval || false;
      approvalStatus = requiresApproval ? 'pending' : 'approved';

      // Build fields object dynamically, only including fields that have values
      // Note: Do not include computed fields like 'Submitted At' - Airtable handles these automatically
      const fields: Record<string, any> = {
        Name: data.name,
        Email: data.email,
        'Announcement Body': data.announcementBody,
        'Approval Status': approvalStatus,
        'Requires Approval': requiresApproval,
      };

      // Only add optional fields if they have values
      if (data.ministry) fields.Ministry = data.ministry;
      if (data.eventDate) fields['Date of Event'] = data.eventDate;
      if (data.eventTime) fields['Time of Event'] = data.eventTime;
      if (data.promotionStart) fields['Promotion Start Date'] = data.promotionStart;
      if (data.platforms && data.platforms.length > 0) fields.Platforms = data.platforms;
      if (data.addToCalendar !== undefined) fields['Add to Events Calendar'] = data.addToCalendar ? 'Yes' : 'No';
      if (data.isExternalEvent !== undefined) fields['External Event'] = data.isExternalEvent ? 'Yes' : 'No';
      if (fileLinksString) fields['File Links'] = fileLinksString;
      if (data.signUpUrl) fields['Sign Up URL'] = data.signUpUrl;
      if (ministry?.id) fields['Ministry ID'] = ministry.id;

      const base = getAirtableBase();
      console.log('Creating Airtable record with fields:', Object.keys(fields));

      const record = await base(TABLE_NAMES.ANNOUNCEMENTS).create([
        { fields },
      ]);

      console.log('Airtable record created:', record);
    }

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
        <li><strong>Requested Publication Weekend:</strong> ${data.promotionStart || 'N/A'}</li>
        ${data.publicationNotes ? `<li><strong>Publication Notes:</strong> ${data.publicationNotes}</li>` : ''}
        <li><strong>Add to Calendar:</strong> ${data.addToCalendar ? 'Yes' : 'No'}</li>
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
            <li><strong>Requested Publication Weekend:</strong> ${data.promotionStart || 'N/A'}</li>
            ${data.publicationNotes ? `<li><strong>Publication Notes:</strong> ${data.publicationNotes}</li>` : ''}
            <li><strong>External Event:</strong> ${data.isExternalEvent ? 'Yes' : 'No'}</li>
          </ul>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <h4>Announcement Body:</h4>
            <p>${data.announcementBody.replace(/\n/g, '<br/>')}</p>
          </div>
          ${fileLinksString ? `<p><strong>Attached Files:</strong><br/>${fileLinksString.replace(/\n/g, '<br/>')}</p>` : ''}
          <p><a href="https://comms.sainthelen.org/admin/approvals" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Review in Admin Portal</a></p>
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
    
    // Handle specific Airtable field errors
    let errorMessage = error.message || 'Submission failed';
    if (error.message && error.message.includes('unknown field name')) {
      errorMessage = `Field configuration error: ${error.message}. Please contact the administrator.`;
    }
    
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { status: 500 }
    );
  }
}