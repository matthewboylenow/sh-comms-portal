// app/lib/email.ts
// Shared helper for sending mail through Microsoft Graph.

const TENANT_ID = process.env.AZURE_AD_TENANT_ID;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET;

// Mailbox the portal sends from (also the default admin inbox).
const FROM_ADDRESS = process.env.MAILBOX_TO_SEND_FROM || 'mboyle@sainthelen.org';

// Where admin notifications (urgent alerts, daily digest) get delivered.
// Defaults to the sending mailbox; override with ADMIN_NOTIFICATION_EMAIL.
export function getAdminNotificationEmail(): string {
  return process.env.ADMIN_NOTIFICATION_EMAIL || FROM_ADDRESS;
}

export function isEmailConfigured(): boolean {
  return Boolean(TENANT_ID && CLIENT_ID && CLIENT_SECRET);
}

type SendEmailOptions = {
  to: string;
  subject: string;
  htmlContent: string;
  importance?: 'low' | 'normal' | 'high';
  flag?: boolean;
};

export async function sendEmailViaGraph({
  to,
  subject,
  htmlContent,
  importance = 'normal',
  flag = false,
}: SendEmailOptions): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(`[email] Not configured, skipping send: "${subject}" to ${to}`);
    return;
  }

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error('Failed to get Microsoft Graph access token');
  }

  const { access_token } = await tokenResponse.json();

  const message: Record<string, any> = {
    subject,
    body: { contentType: 'HTML', content: htmlContent },
    toRecipients: [{ emailAddress: { address: to } }],
    importance,
  };

  if (flag) {
    message.flag = { flagStatus: 'flagged' };
  }

  const sendResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${FROM_ADDRESS}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    }
  );

  if (!sendResponse.ok) {
    const error = await sendResponse.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}
