// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getAirtableBaseSafe, TABLE_NAMES } from '../../lib/airtable';

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

    const createdComment = await base(TABLE_NAMES.COMMENTS || 'Comments').create([commentData]);

    // Send email notification to the original requester
    await sendCommentNotification(recordId, tableName, message, isPublic ? publicName : session?.user?.name || 'Admin');

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

async function sendCommentNotification(recordId: string, tableName: string, message: string, commenterName: string) {
  try {
    const base = getAirtableBaseSafe();
    if (!base) return;

    // Get the original record to find the requester's email
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

    const requesterEmail = record.fields['Email'] || record.fields['Contact Email'];
    if (!requesterEmail) return;

    // Send email using Microsoft Graph
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: requesterEmail,
        subject: `New Comment on Your ${tableName.replace(/([A-Z])/g, ' $1').toLowerCase()} Request`,
        body: `
          <h2>New Comment on Your Request</h2>
          <p>Hello,</p>
          <p><strong>${commenterName}</strong> has left a comment on your request:</p>
          <blockquote style="border-left: 4px solid #blue; padding-left: 16px; margin: 16px 0; color: #666;">
            ${message.replace(/\n/g, '<br>')}
          </blockquote>
          <p>To respond to this comment, please reply to this email or visit our portal.</p>
          <p>Thank you!</p>
          <p><em>Saint Helen Communications Team</em></p>
        `
      })
    });

    if (!response.ok) {
      console.error('Failed to send comment notification email');
    }
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
}