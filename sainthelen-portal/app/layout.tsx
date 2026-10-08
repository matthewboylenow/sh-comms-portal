// app/layout.tsx
import './globals.css';
import { Metadata } from 'next';
import Providers from './providers';

import { Public_Sans, Libre_Baskerville } from 'next/font/google';

// Public Sans is built on Libre Franklin, the parish's body font, and carries
// the weights a product UI needs. It is the only face in the interface.
const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-public-sans',
  fallback: ['Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
});

// Libre Baskerville appears once: in the logo wordmark.
const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-baskerville',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: 'Saint Helen Communications Portal',
  description: 'A Next.js 14 + Tailwind Portal for Saint Helen Parish',
};

export const viewport = {
  themeColor: '#20336B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${baskerville.variable}`}
      suppressHydrationWarning
    >
      <head>
        
        {/* Apple iOS icons */}
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/images/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/images/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
        
        {/* Home screen icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
        <link rel="mask-icon" href="/images/safari-pinned-tab.svg" color="#20336B" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-1668-2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-1242-2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-828-1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-1242-2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/images/splash/apple-splash-640-1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        
      </head>
      <body className="min-h-screen flex flex-col bg-canvas text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}