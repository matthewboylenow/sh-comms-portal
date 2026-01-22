// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getAirtableBaseSafe, TABLE_NAMES } from '../../lib/airtable';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

// New Neon database imports
import { useNeonDatabase } from '../../lib/db';
import * as commentsService from '../../lib/db/services/comments';
import * as announcementsService from '../../lib/db/services/announcements';
import * as websiteUpdatesService from '../../lib/db/services/website-updates';
import * as smsRequestsService from '../../lib/db/services/sms-requests';
import * as avRequestsService from '../../lib/db/services/av-requests';
import * as flyerReviewsService from '../../lib/db/services/flyer-reviews';
import * as graphicDesignService from '../../lib/db/services/graphic-design';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const tableName = searchParams.get('tableName');

    if (!recordId || !tableName) {
      return NextResponse.json(
        { error: 'recordId and tableName are required' },
        { status: 400 }
      );
    }

    const useNeon = useNeonDatabase();

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      const comments = await commentsService.getCommentsForRecord(recordId, tableName);

      const formattedComments = comments.map(comment => ({
        id: comment.id,
        fields: {
          'Record ID': comment.recordId,
          'Table Name': comment.tableName,
          'Message': comment.message,
          'Created At': comment.createdAt?.toISOString(),
          'Is Public': comment.isPublic,
          'Public Name': comment.publicName,
          'Public Email': comment.publicEmail,
          'Admin User': comment.adminUser,
        }
      }));

      return NextResponse.json({ comments: formattedComments });
    }

    // ===== AIRTABLE DATABASE PATH (Legacy) =====
    const base = getAirtableBaseSafe();
    if (!base) {
      return NextResponse.json(
        { error: 'Airtable not configured' },
        { status: 500 }
      );
    }

    // Fetch comments for the specific record
    const comments = await base(TABLE_NAMES.COMMENTS || 'Comments')
      .select({
        filterByFormula: `AND({Record ID} = '${recordId}', {Table Name} = '${tableName}')`,
        sort: [{ field: 'Created At', direction: 'asc' }]
      })
      .all();

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      fields: comment.fields
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { recordId, tableName, message, isPublic = false, publicName = '', publicEmail = '' } = await request.json();

    if (!recordId || !tableName || !message) {
      return NextResponse.json(
        { error: 'recordId, tableName, and message are required' },
        { status: 400 }
      );
    }

    // For public comments, require name and email
    if (isPublic && (!publicName || !publicEmail)) {
      return NextResponse.json(
        { error: 'Public comments require name and email' },
        { status: 400 }
      );
    }

    const useNeon = useNeonDatabase();
    let createdComment: any;

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      if (isPublic) {
        createdComment = await commentsService.createPublicComment(
          recordId,
          tableName,
          message,
          publicName,
          publicEmail
        );
      } else {
        const adminUser = session?.user?.name || session?.user?.email || 'Admin';
        createdComment = await commentsService.createAdminComment(
          recordId,
          tableName,
          message,
          adminUser
        );
      }

      // Send email notification to the original requester
      await sendCommentNotification(recordId, tableName, message, useNeon);

      return NextResponse.json({
        success: true,
        comment: {
          id: createdComment.id,
          fields: {
            'Record ID': createdComment.recordId,
            'Table Name': createdComment.tableName,
            'Message': createdComment.message,
            'Created At': createdComment.createdAt?.toISOString(),
            'Is Public': createdComment.isPublic,
            'Public Name': createdComment.publicName,
            'Public Email': createdComment.publicEmail,
            'Admin User': createdComment.adminUser,
          }
        }
      });
    }

    // ===== AIRTABLE DATABASE PATH (Legacy) =====
    const base = getAirtableBaseSafe();
    if (!base) {
      return NextResponse.json(
        { error: 'Airtable not configured' },
        { status: 500 }
      );
    }

    // Create comment record
    const commentData: any = {
      'Record ID': recordId,
      'Table Name': tableName,
      'Message': message,
      'Created At': new Date().toISOString(),
      'Is Public': isPublic,
    };

    if (isPublic) {
      commentData['Public Name'] = publicName;
      commentData['Public Email'] = publicEmail;
      commentData['Admin User'] = '';
    } else if (session?.user) {
      commentData['Admin User'] = session.user.name || session.user.email || 'Admin';
      commentData['Public Name'] = '';
      commentData['Public Email'] = '';
    }

    createdComment = await base(TABLE_NAMES.COMMENTS || 'Comments').create([commentData]);

    // Send email notification to the original requester
    await sendCommentNotification(recordId, tableName, message, useNeon);

    return NextResponse.json({
      success: true,
      comment: {
        id: createdComment[0].id,
        fields: createdComment[0].fields
      }
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    );
  }
}

// Microsoft Graph client setup
let graphClient: Client | null = null;

function getGraphClient() {
  if (!graphClient) {
    const credential = new ClientSecretCredential(
      process.env.AZURE_AD_TENANT_ID || '',
      process.env.AZURE_AD_CLIENT_ID || '',
      process.env.AZURE_AD_CLIENT_SECRET || ''
    );

    graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          return token?.token || '';
        }
      }
    });
  }
  return graphClient;
}

async function sendCommentNotification(recordId: string, tableName: string, message: string, useNeon: boolean) {
  try {
    let requesterEmail: string | null = null;
    let requesterName: string | null = null;
    let recordFields: any = {};

    if (useNeon) {
      // ===== NEON DATABASE PATH =====
      let neonRecord: any;
      switch (tableName) {
        case 'announcements':
          neonRecord = await announcementsService.getAnnouncementById(recordId);
          break;
        case 'websiteUpdates':
          neonRecord = await websiteUpdatesService.getWebsiteUpdateById(recordId);
          break;
        case 'smsRequests':
          neonRecord = await smsRequestsService.getSmsRequestById(recordId);
          break;
        case 'avRequests':
          neonRecord = await avRequestsService.getAvRequestById(recordId);
          break;
        case 'flyerReviews':
          neonRecord = await flyerReviewsService.getFlyerReviewById(recordId);
          break;
        case 'graphicDesign':
          neonRecord = await graphicDesignService.getGraphicDesignRequestById(recordId);
          break;
        default:
          return;
      }

      if (!neonRecord) return;

      requesterEmail = neonRecord.email;
      requesterName = neonRecord.name;
      // Convert Neon record to fields format for email template
      recordFields = {
        'Name': neonRecord.name,
        'Email': neonRecord.email,
        'Description': neonRecord.description || neonRecord.projectDescription || neonRecord.announcementBody,
        'Page to Update': neonRecord.pageToUpdate,
        'Sign-Up URL': neonRecord.signUpUrl,
        'Urgent': neonRecord.urgent ? 'Yes' : 'No',
        'Created': neonRecord.createdAt?.toISOString(),
        'Event Name': neonRecord.eventName,
        'Event Date': neonRecord.eventDate || neonRecord.dateOfEvent,
        'Priority': neonRecord.priority,
        'Message': neonRecord.smsMessage,
        'Send Date': neonRecord.requestedDate,
        'Equipment Needed': neonRecord.avNeeds,
      };
    } else {
      // ===== AIRTABLE DATABASE PATH (Legacy) =====
      const base = getAirtableBaseSafe();
      if (!base) return;

      let record;
      switch (tableName) {
        case 'announcements':
          record = await base(TABLE_NAMES.ANNOUNCEMENTS).find(recordId);
          break;
        case 'websiteUpdates':
          record = await base(TABLE_NAMES.WEBSITE_UPDATES).find(recordId);
          break;
        case 'smsRequests':
          record = await base(TABLE_NAMES.SMS_REQUESTS).find(recordId);
          break;
        case 'avRequests':
          record = await base(TABLE_NAMES.AV_REQUESTS).find(recordId);
          break;
        case 'flyerReviews':
          record = await base('Flyer Reviews').find(recordId);
          break;
        case 'graphicDesign':
          record = await base(TABLE_NAMES.GRAPHIC_DESIGN).find(recordId);
          break;
        default:
          return;
      }

      if (!record) return;

      requesterEmail = record.fields['Email'] as string || record.fields['Contact Email'] as string;
      requesterName = record.fields['Name'] as string;
      recordFields = record.fields;
    }

    if (!requesterEmail) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailStr = String(requesterEmail);
    if (!emailRegex.test(emailStr)) return;

    // Extract original submission details based on table type
    const submissionDetails = getSubmissionDetailsFromFields(recordFields, tableName);

    // Generate public response link
    const baseUrl = process.env.NEXTAUTH_URL || 'https://your-domain.com';
    const params = new URLSearchParams({
      table: tableName,
      name: String(requesterName || ''),
      email: emailStr
    });
    const publicResponseLink = `${baseUrl}/comment/${recordId}?${params.toString()}`;

    // Send email using Microsoft Graph directly
    const client = getGraphClient();

    // Prepare email message
    const emailMessage = {
      subject: `New Comment on Your ${tableName.replace(/([A-Z])/g, ' $1').toLowerCase()} Request`,
      body: {
        contentType: 'HTML' as const,
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">New Comment on Your Request</h2>

            <p>Hello ${requesterName || 'there'},</p>

            <p><strong>Matthew Boyle</strong> has left a comment on your request:</p>

            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #374151; font-style: italic;">${message.replace(/\n/g, '<br>')}</p>
            </div>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">Your Original Submission:</h3>
              ${submissionDetails}
            </div>

            <div style="background-color: #e8f4fd; border: 1px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #2563eb; margin-top: 0; margin-bottom: 15px;">Want to Respond?</h3>
              <p style="margin-bottom: 15px; color: #374151;">Click the button below to respond to this comment:</p>
              <a href="${publicResponseLink}"
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 6px; font-weight: bold;
                        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                Respond to Comment
              </a>
            </div>

            <p>Thank you!</p>
            <p><em>Saint Helen Communications Team</em></p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              Saint Helen Parish • <a href="https://sainthelen.org" style="color: #2563eb;">sainthelen.org</a>
            </p>
          </div>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: emailStr
          }
        }
      ],
      from: {
        emailAddress: {
          address: 'mboyle@sainthelen.org',
          name: 'Saint Helen Communications'
        }
      }
    };

    // Send email via Microsoft Graph
    await client
      .api('/users/mboyle@sainthelen.org/sendMail')
      .post({
        message: emailMessage,
        saveToSentItems: true
      });

  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
}

function getSubmissionDetailsFromFields(fields: any, tableName: string): string {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  switch (tableName) {
    case 'websiteUpdates':
      return `
        <p><strong>Page to Update:</strong> ${fields['Page to Update'] || 'Not specified'}</p>
        <p><strong>Description:</strong></p>
        <div style="background-color: white; padding: 12px; border-radius: 4px; margin: 8px 0;">
          ${(fields['Description'] || 'No description provided').replace(/\n/g, '<br>')}
        </div>
        ${fields['Sign-Up URL'] ? `<p><strong>Sign-Up URL:</strong> <a href="${fields['Sign-Up URL']}" style="color: #2563eb;">${fields['Sign-Up URL']}</a></p>` : ''}
        ${fields['Urgent'] === 'Yes' ? '<p><strong>⚠️ Marked as Urgent</strong></p>' : ''}
        <p><strong>Submitted:</strong> ${fields['Created'] ? formatDate(fields['Created']) : 'Unknown date'}</p>
      `;

    case 'announcements':
      return `
        <p><strong>Event Name:</strong> ${fields['Event Name'] || 'Not specified'}</p>
        <p><strong>Event Date:</strong> ${fields['Event Date'] ? formatDate(fields['Event Date']) : 'Not specified'}</p>
        <p><strong>Description:</strong></p>
        <div style="background-color: white; padding: 12px; border-radius: 4px; margin: 8px 0;">
          ${(fields['Description'] || 'No description provided').replace(/\n/g, '<br>')}
        </div>
        ${fields['Priority'] ? `<p><strong>Priority:</strong> ${fields['Priority']}</p>` : ''}
        <p><strong>Submitted:</strong> ${fields['Created'] ? formatDate(fields['Created']) : 'Unknown date'}</p>
      `;

    case 'flyerReviews':
      return `
        <p><strong>Event Name:</strong> ${fields['Event Name'] || 'Not specified'}</p>
        <p><strong>Event Date:</strong> ${fields['Event Date'] ? formatDate(fields['Event Date']) : 'Not specified'}</p>
        <p><strong>Description:</strong></p>
        <div style="background-color: white; padding: 12px; border-radius: 4px; margin: 8px 0;">
          ${(fields['Description'] || 'No description provided').replace(/\n/g, '<br>')}
        </div>
        ${fields['Rush Job'] === 'Yes' ? '<p><strong>⚡ Rush Job Requested</strong></p>' : ''}
        <p><strong>Submitted:</strong> ${fields['Created'] ? formatDate(fields['Created']) : 'Unknown date'}</p>
      `;

    case 'graphicDesign':
      return `
        <p><strong>Project Name:</strong> ${fields['Name'] || fields['Project Name'] || 'Not specified'}</p>
        <p><strong>Description:</strong></p>
        <div style="background-color: white; padding: 12px; border-radius: 4px; margin: 8px 0;">
          ${(fields['Description'] || 'No description provided').replace(/\n/g, '<br>')}
        </div>
        ${fields['Priority'] ? `<p><strong>Priority:</strong> ${fields['Priority']}</p>` : ''}
        <p><strong>Submitted:</strong> ${fields['Created'] ? formatDate(fields['Created']) : 'Unknown date'}</p>
      `;

    case 'smsRequests':
      return `
        <p><strong>Message Type:</strong> ${fields['Message Type'] || 'Not specified'}</p>
        <p><strong>Message Content:</strong></p>
        <div style="background-color: white; padding: 12px; border-radius: 4px; margin: 8px 0;">
          ${(fields['Message'] || 'No message provided').replace(/\n/g, '<br>')}
        </div>
        ${fields['Send Date'] ? `<p><strong>Requested Send Date:</strong> ${formatDate(fields['Send Date'])}</p>` : ''}
        <p><strong>Submitted:</strong> ${fields['Created'] ? formatDate(fields['Created']) : 'Unknown date'}</p>
      `;

    case 'avRequests':
      return `
        <p><strong>Event Name:</strong> ${fields['Event Name'] || 'Not specified'}</p>
        <p><strong>Event Date:</strong> ${fields['Event Date'] ? formatDate(fields['Event Date']) : 'Not specified'}</p>
        <p><strong>Description:</strong></p>
        <div style="background-color: white; padding: 12px; border-radius: 4px; margin: 8px 0;">
          ${(fields['Description'] || 'No description provided').replace(/\n/g, '<br>')}
        </div>
        ${fields['Equipment Needed'] ? `<p><strong>Equipment Needed:</strong> ${fields['Equipment Needed']}</p>` : ''}
        <p><strong>Submitted:</strong> ${fields['Created'] ? formatDate(fields['Created']) : 'Unknown date'}</p>
      `;

    default:
      return `
        <p><strong>Request Details:</strong></p>
        <div style="background-color: white; padding: 12px; border-radius: 4px; margin: 8px 0;">
          ${(fields['Description'] || fields['Message'] || 'No details available').replace(/\n/g, '<br>')}
        </div>
        <p><strong>Submitted:</strong> ${fields['Created'] ? formatDate(fields['Created']) : 'Unknown date'}</p>
      `;
  }
}
