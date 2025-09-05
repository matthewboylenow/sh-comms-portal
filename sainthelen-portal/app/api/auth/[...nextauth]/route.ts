// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import type { NextAuthOptions } from 'next-auth';

// Export authOptions for use in other routes
export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
      authorization: { params: { scope: 'openid profile email offline_access' } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    error: '/auth/error',
  },
  callbacks: {
    // Allow specific admin users to sign in
    signIn: async ({ user, account, profile, email, credentials }) => {
      const allowedEmails = [
        'mboyle@sainthelen.org',
        'ccolonna@sainthelen.org', 
        'mauricchio@sainthelen.org',
        'faith@sainthelen.org'
      ];
      
      if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
        return true;
      }
      return false;
    },
    jwt: async ({ token, user, account }) => {
      // Persist user data to the token right after signin
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Send properties to the client
      if (token && session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};

// For App Router, we wrap NextAuth in a custom handler with cache control
const handler = NextAuth(authOptions);

// Wrap handlers with cache control headers
const GET = async (req: Request, context: any) => {
  const response = await handler(req, context);
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
};

const POST = async (req: Request, context: any) => {
  const response = await handler(req, context);
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
};

export { GET, POST };