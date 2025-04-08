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
    // If you only want certain domain emails to sign in, you can filter in `signIn`.
    // signIn: async ({ user, account, profile, email, credentials }) => {
    //   if (user.email?.endsWith('@sainthelen.org')) {
    //     return true;
    //   }
    //   return false;
    // },
  },
};

// For App Router, we wrap NextAuth in a custom handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };