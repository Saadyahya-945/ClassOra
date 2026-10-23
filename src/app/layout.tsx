import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClassOra — Academic Management PWA',
  description: 'Precision Swiss Ledger for Professors & High-Craft Academic Wallet for Students',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC] text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}
