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
        
        {/* Web Push Notification support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
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