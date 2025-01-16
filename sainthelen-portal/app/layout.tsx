// app/layout.tsx
import './globals.css';
import { Metadata } from 'next';
import Header from './components/Header';

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
    // 3) Use the font variables on <html>
    <html lang="en" className={`${franklin.variable} ${baskerville.variable}`}>
      {/* 
        4) Ensure the body is min-h-screen so dark mode covers entire viewport.
        We apply dark mode background colors in globals.css or here via Tailwind.
      */}
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#121212] transition-colors duration-300">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
