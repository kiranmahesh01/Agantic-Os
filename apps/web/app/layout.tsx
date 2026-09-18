import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agency OS',
  description: 'Website in, social posts out.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-[var(--accent)]" />
            <span className="font-semibold tracking-tight">Agency OS</span>
            <nav className="ml-auto flex items-center gap-5 text-sm text-[var(--muted)]">
              <a href="/dashboard" className="hover:text-[var(--fg)]">Clients</a>
              <a href="/billing" className="hover:text-[var(--fg)]">Billing</a>
              <a href="/admin" className="hover:text-[var(--fg)]">Admin</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
