// app/layout.tsx
import './globals.css';
import { Metadata } from 'next';
import Header from './components/Header';
import Providers from './providers';

// 1) Import your Google Fonts from next/font/google
import { Libre_Franklin, Libre_Baskerville, Inter } from 'next/font/google';

// 2) Declare the fonts with weights
const franklin = Libre_Franklin({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-franklin',
});

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-baskerville',
});

// Add Inter for modern UI elements in the admin interface
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Saint Helen Communications Portal',
  description: 'A Next.js 14 + Tailwind Portal for Saint Helen Parish',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SH Comms Portal'
  }
};

export const viewport = {
  themeColor: '#20336B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${franklin.variable} ${baskerville.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SH Comms Portal" />
        <meta name="application-name" content="SH Comms Portal" />
        <meta name="theme-color" content="#20336B" />
        <meta name="msapplication-TileColor" content="#20336B" />
        <meta name="msapplication-navbutton-color" content="#20336B" />
        
        {/* Apple iOS icons */}
        <link rel="apple-touch-icon" href="/images/Saint-Helen-Logo-White.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/images/Saint-Helen-Logo-White.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/images/Saint-Helen-Logo-White.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/Saint-Helen-Logo-White.png" />
        
        {/* Home screen icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/images/Saint-Helen-Logo-White.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/Saint-Helen-Logo-White.png" />
        <link rel="mask-icon" href="/images/Saint-Helen-Logo-White.png" color="#20336B" />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#121212] transition-colors duration-300">
        {/* Wrap everything in the SessionProvider */}
        <Providers>
          {/* The Header component is conditionally rendered only on non-admin pages */}
          {children}
        </Providers>
      </body>
    </html>
  );
}