// app/layout.tsx
import './globals.css';
import { Metadata } from 'next';
import Header from './components/Header';
import Providers from './providers';

// 1) Import your Google Fonts from next/font/google
import { Libre_Franklin, Libre_Baskerville } from 'next/font/google';

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

export const metadata: Metadata = {
  title: 'Saint Helen Communications Portal',
  description: 'A Next.js 14 + Tailwind Portal for Saint Helen Parish',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${franklin.variable} ${baskerville.variable}`}
    >
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