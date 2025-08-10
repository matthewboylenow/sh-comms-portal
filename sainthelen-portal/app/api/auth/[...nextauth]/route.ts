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
  },
  callbacks: {
    // Allow specific admin users to sign in
    signIn: async ({ user, account, profile, email, credentials }) => {
      const allowedEmails = [
        'mboyle@sainthelen.org',
        'ccolonna@sainthelen.org', 
        'mauricchio@sainthelen.org'
      ];
      
      if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
        return true;
      }
      return false;
    },
  },
};

// For App Router, we wrap NextAuth in a custom handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };