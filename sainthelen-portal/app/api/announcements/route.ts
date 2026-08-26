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
  eventDates?: { date: string; time?: string }[];
  promotionStart?: string;
  platforms?: string[]; // e.g. ["Email Blast", "Bulletin", "Church Screens"]
  announcementBody: string;
  addToCalendar?: boolean;
  // Event calendar detail fields (sent when addToCalendar is true)
  calendarEventName?: string;
  calendarEventDate?: string;
  calendarEventStartTime?: string;
  calendarEventEndTime?: string;
  calendarEventDescription?: string;
  calendarEventLocation?: string;
  calendarEventSignUpLink?: string;
  isExternalEvent?: boolean;
  socialConsideration?: boolean;
  socialWhatToKnow?: string;
  socialHasPhotos?: string;
  fileLinks?: string[];
  signUpUrl?: string;
  signUpLinks?: { label?: string; url: string }[];
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
    let createdId: string | null = null;

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
        // Only include the multi-value columns when populated, so inserts
        // still work if the 0003 migration hasn't been applied yet
        ...(data.eventDates?.length ? { eventDates: data.eventDates } : {}),
        promotionStartDate: data.promotionStart || null,
        platforms: data.platforms || null,
        addToEventsCalendar: data.addToCalendar || false,
        // Event calendar detail fields
        calendarEventName: data.calendarEventName || null,
        calendarEventDate: data.calendarEventDate || null,
        calendarEventStartTime: data.calendarEventStartTime || null,
        calendarEventEndTime: data.calendarEventEndTime || null,
        calendarEventDescription: data.calendarEventDescription || null,
        calendarEventLocation: data.calendarEventLocation || null,
        calendarEventSignUpLink: data.calendarEventSignUpLink || null,
        externalEvent: data.isExternalEvent || false,
        // Only include when set, so inserts still work if the 0004 migration
        // hasn't been applied yet
        ...(data.socialConsideration
          ? {
              socialConsideration: true,
              socialWhatToKnow: data.socialWhatToKnow || null,
              socialHasPhotos: data.socialHasPhotos || null,
            }
          : {}),
        fileLinks: data.fileLinks || null,
        signUpUrl: data.signUpUrl || null,
        ...(data.signUpLinks?.length ? { signUpLinks: data.signUpLinks } : {}),
        publicationNotes: data.publicationNotes || null,
        approvalStatus,
        requiresApproval,
      });

      console.log('Neon record created:', announcement.id);
      createdId = announcement.id;

      // Auto-create WordPress event draft if calendar is requested
      if (data.addToCalendar && data.calendarEventName && data.calendarEventDate) {
        try {
          const wpResult = await createWordPressEventDraft({
            eventName: data.calendarEventName,
            eventDate: data.calendarEventDate,
            startTime: data.calendarEventStartTime || '',
            endTime: data.calendarEventEndTime || '',
            description: data.calendarEventDescription || '',
            location: data.calendarEventLocation || '',
            signUpLink: data.calendarEventSignUpLink || '',
          });

          if (wpResult?.id) {
            // Update the announcement with WordPress event info
            const { updateWordPressEventInfo } = await import('../../lib/db/services/announcements');
            await updateWordPressEventInfo(
              announcement.id,
              wpResult.id,
              wpResult.url || ''
            );
            console.log('WordPress draft event created:', wpResult.id);
          }
        } catch (wpError) {
          // Don't fail the submission if WordPress draft creation fails
          console.error('Failed to create WordPress event draft:', wpError);
        }
      }
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
      createdId = record[0]?.id || null;
    }

    // 2) Send confirmation email via Microsoft Graph
    const client = getGraphClient();
    const fromAddress = process.env.MAILBOX_TO_SEND_FROM || '';
    const subject = 'Saint Helen Announcement Received';
    
    const approvalText = requiresApproval 
      ? `<p style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;"><strong>Approval Required:</strong> This announcement requires approval from the Coordinator of Adult Discipleship before being published. You will receive an email notification once it has been reviewed.</p>`
      : `<p style="background-color: #d1fae5; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981;"><strong>Status:</strong> Your announcement has been received and will be processed by our communications team.</p>`;

    const eventDatesText = data.eventDates?.length
      ? data.eventDates.map((d) => `${d.date}${d.time ? ` ${d.time}` : ''}`).join('; ')
      : `${data.eventDate || 'N/A'} ${data.eventTime || ''}`;
    const signUpLinksHtml = data.signUpLinks?.length
      ? data.signUpLinks
          .map((l) => `${l.label ? `${l.label}: ` : ''}<a href="${l.url}">${l.url}</a>`)
          .join('<br/>')
      : data.signUpUrl || '';

    const htmlContent = `
      <p>Hello ${data.name},</p>
      <p>We received your announcement request:</p>
      <ul>
        <li><strong>Ministry:</strong> ${data.ministry || 'N/A'}</li>
        <li><strong>Event Date(s):</strong> ${eventDatesText}</li>
        ${signUpLinksHtml ? `<li><strong>Sign-Up Link(s):</strong><br/>${signUpLinksHtml}</li>` : ''}
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
            <li><strong>Event Date(s):</strong> ${eventDatesText}</li>
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

    return NextResponse.json({ success: true, id: createdId });
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

/**
 * Creates a draft event in WordPress via the sh-events/v1/create endpoint.
 * This is called automatically when an announcement is submitted with
 * "Add to Events Calendar" toggled on.
 */
async function createWordPressEventDraft(eventData: {
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  signUpLink: string;
}): Promise<{ id: number; url: string } | null> {
  const WP_BASE_URL = process.env.WP_API_URL?.replace('/tribe/events/v1', '') || 'https://sainthelen.org/wp-json';
  const WP_AUTH_USERNAME = process.env.WP_AUTH_USERNAME || '';
  const WP_AUTH_PASSWORD = process.env.WP_AUTH_PASSWORD || '';

  if (!WP_AUTH_USERNAME || !WP_AUTH_PASSWORD) {
    console.log('WordPress credentials not configured, skipping event draft creation');
    return null;
  }

  const authString = Buffer.from(`${WP_AUTH_USERNAME}:${WP_AUTH_PASSWORD}`).toString('base64');

  // Build start/end datetime strings
  const startDateTime = eventData.startTime
    ? `${eventData.eventDate} ${eventData.startTime}:00`
    : `${eventData.eventDate} 00:00:00`;

  let endDateTime: string;
  if (eventData.endTime) {
    endDateTime = `${eventData.eventDate} ${eventData.endTime}:00`;
  } else if (eventData.startTime) {
    // Default to 1 hour after start
    const [hours, minutes] = eventData.startTime.split(':').map(Number);
    const endHours = String(hours + 1).padStart(2, '0');
    endDateTime = `${eventData.eventDate} ${endHours}:${String(minutes).padStart(2, '0')}:00`;
  } else {
    endDateTime = `${eventData.eventDate} 23:59:00`;
  }

  // Build description with sign-up link if provided
  let fullDescription = eventData.description;
  if (eventData.signUpLink) {
    fullDescription += `\n\n<a href="${eventData.signUpLink}">Sign Up Here</a>`;
  }

  const payload = {
    title: eventData.eventName,
    description: fullDescription,
    start_date: startDateTime,
    end_date: endDateTime,
    status: 'draft',
    venue: eventData.location ? { venue: eventData.location } : undefined,
    website: eventData.signUpLink || undefined,
  };

  const response = await fetch(`${WP_BASE_URL}/sh-events/v1/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('WordPress event creation failed:', response.status, errorText);

    // Fallback: try the tribe events API
    const fallbackResponse = await fetch(
      `${process.env.WP_API_URL || 'https://sainthelen.org/wp-json/tribe/events/v1'}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
        body: JSON.stringify({
          title: eventData.eventName,
          description: fullDescription,
          start_date: startDateTime,
          end_date: endDateTime,
          status: 'draft',
          featured: false,
        }),
      }
    );

    if (!fallbackResponse.ok) {
      const fallbackError = await fallbackResponse.text();
      throw new Error(`WordPress event creation failed: ${fallbackError}`);
    }

    const fallbackData = await fallbackResponse.json();
    return {
      id: fallbackData.id,
      url: fallbackData.url || '',
    };
  }

  const data = await response.json();
  return {
    id: data.id || data.event_id,
    url: data.url || data.event_url || '',
  };
}