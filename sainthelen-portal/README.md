This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Web Push Notifications

This project supports web push notifications for new submissions when added to your home screen on mobile devices. To set up push notifications:

1. Generate VAPID keys for your application:

```bash
npx web-push generate-vapid-keys
```

2. Add the private key to your environment variables:

```
VAPID_PRIVATE_KEY=your_generated_private_key
```

3. Update the PUBLIC_VAPID_KEY in `/app/context/PushNotificationContext.tsx` with your generated public key.

4. Create a new "PushSubscriptions" table in your Airtable base with the following fields:
   - endpoint (Single line text)
   - subscription (Long text)
   - userEmail (Single line text)
   - createdAt (Single line text)
   - updatedAt (Single line text)

5. To receive push notifications on iOS devices:
   - Add the app to your home screen
   - Tap "Share" and "Add to Home Screen" in Safari
   - Launch the app from the home screen icon
   - Enable notifications when prompted

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
