// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

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

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated for internal calls
    const session = await getServerSession(authOptions);
    const { to, subject, body, fromInternal = false } = await request.json();

    if (!fromInternal && !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const client = getGraphClient();
    
    // Prepare email message
    const message = {
      subject: subject,
      body: {
        contentType: 'HTML' as const,
        content: body
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ],
      from: {
        emailAddress: {
          address: 'mboyle@sainthelen.org', // Default sender
          name: 'Saint Helen Communications'
        }
      }
    };

    // Send email via Microsoft Graph
    await client
      .api('/users/mboyle@sainthelen.org/sendMail')
      .post({
        message: message,
        saveToSentItems: true
      });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Handle specific Graph API errors
    if (error.code) {
      return NextResponse.json(
        { 
          error: 'Email service error', 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}