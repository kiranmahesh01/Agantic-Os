import './globals.css';
import type { Metadata } from 'next';
import Rail from '@/components/Rail';

export const metadata: Metadata = {
  title: 'Agency OS',
  description: 'Social posts for restaurants, written from what the kitchen actually serves.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Rail />
          <main className="flex-1 min-w-0 px-6 sm:px-10 py-9 max-w-[1100px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
