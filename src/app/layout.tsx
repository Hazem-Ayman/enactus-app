import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Enactus AU Presentations',
  description: 'Beta education & points platform for Presentations Committee members',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-yellow-500/30`}>
        {/* Centered mobile-width container for desktop, full width on mobile */}
        <div className="max-w-md mx-auto min-h-screen bg-slate-900 shadow-2xl relative flex flex-col pb-20 border-x border-slate-800/60">
          <main className="flex-1 w-full px-4 py-6">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
