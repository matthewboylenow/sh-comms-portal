// app/api/comments/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAirtableBaseSafe, TABLE_NAMES } from '../../../lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const { recordId, tableName, message, name, email, token } = await request.json();

    if (!recordId || !tableName || !message || !name || !email) {
      return NextResponse.json(
        { error: 'All fields are required: recordId, tableName, message, name, email' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Simple anti-spam check (optional token verification would go here)
    if (token && token !== 'allow-public-comment') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const base = getAirtableBaseSafe();
    if (!base) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 500 }
      );
    }

    // Verify the record exists and get the original requester info
    let originalRecord;
    try {
      switch (tableName) {
        case 'announcements':
          originalRecord = await base(TABLE_NAMES.ANNOUNCEMENTS).find(recordId);
          break;
        case 'websiteUpdates':
          originalRecord = await base(TABLE_NAMES.WEBSITE_UPDATES).find(recordId);
          break;
        case 'smsRequests':
          originalRecord = await base(TABLE_NAMES.SMS_REQUESTS).find(recordId);
          break;
        case 'avRequests':
          originalRecord = await base(TABLE_NAMES.AV_REQUESTS).find(recordId);
          break;
        case 'flyerReviews':
          originalRecord = await base(TABLE_NAMES.FLYER_REVIEWS).find(recordId);
          break;
        case 'graphicDesign':
          originalRecord = await base(TABLE_NAMES.GRAPHIC_DESIGN).find(recordId);
          break;
        default:
          throw new Error('Invalid table name');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Record not found or invalid table' },
        { status: 404 }
      );
    }

    // Check if the email matches the original requester
    const originalEmail = originalRecord.fields['Email'] || originalRecord.fields['Contact Email'];
    if (!originalEmail || originalEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email must match the original requester' },
        { status: 403 }
      );
    }

    // Create public comment
    const commentData = {
      'Record ID': recordId,
      'Table Name': tableName,
      'Message': message,
      'Created At': new Date().toISOString(),
      'Is Public': true,
      'Public Name': name,
      'Public Email': email,
      'Admin User': '',
    };

    const createdComment = await base(TABLE_NAMES.COMMENTS).create([commentData]);

    // Send notification to admin team
    await sendAdminNotification(recordId, tableName, message, name, originalRecord);

    return NextResponse.json({
      success: true,
      message: 'Your comment has been submitted successfully. Thank you for your response!',
      comment: {
        id: createdComment[0].id,
        fields: createdComment[0].fields
      }
    });
  } catch (error: any) {
    console.error('Error creating public comment:', error);
    return NextResponse.json(
      { error: 'Failed to submit comment. Please try again later.' },
      { status: 500 }
    );
  }
}

async function sendAdminNotification(recordId: string, tableName: string, message: string, name: string, originalRecord: any) {
  try {
    // Send email to admin team about the public response
    const adminEmails = [
      'mboyle@sainthelen.org',
      'ccolonna@sainthelen.org'
    ];

    const requestTitle = originalRecord.fields['Name'] || 
                        originalRecord.fields['Event Name'] || 
                        originalRecord.fields['Page to Update'] || 
                        'Request';

    const emailBody = `
      <h2>New Public Response Received</h2>
      <p>A public response has been received for a ${tableName.replace(/([A-Z])/g, ' $1').toLowerCase()} request:</p>
      
      <h3>Original Request:</h3>
      <p><strong>Title:</strong> ${requestTitle}</p>
      <p><strong>Record ID:</strong> ${recordId}</p>
      
      <h3>Response From:</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${originalRecord.fields['Email'] || originalRecord.fields['Contact Email']}</p>
      
      <h3>Message:</h3>
      <blockquote style="border-left: 4px solid #3B82F6; padding-left: 16px; margin: 16px 0; color: #666;">
        ${message.replace(/\n/g, '<br>')}
      </blockquote>
      
      <p>Please log into the admin portal to view and respond to this comment.</p>
      
      <p><em>Saint Helen Communications Portal</em></p>
    `;

    for (const adminEmail of adminEmails) {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmail,
          subject: `Public Response: ${requestTitle}`,
          body: emailBody
        })
      });

      if (!response.ok) {
        console.error(`Failed to send admin notification to ${adminEmail}`);
      }
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}