'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const items = [
  { href: '/dashboard', label: 'Clients' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/billing', label: 'Plan' },
  { href: '/admin', label: 'Admin' }
];

export default function Rail() {
  const path = usePathname();
  if (path === '/login') return null;

  return (
    <aside className="w-[190px] shrink-0 border-r border-[var(--line)] px-3 py-7 hidden sm:block">
      <Link href="/dashboard" className="flex items-baseline gap-2 px-3 mb-8">
        <span className="text-[17px] font-bold tracking-tight text-[var(--chalk)]">Agency</span>
        <span className="text-[17px] font-bold tracking-tight text-[var(--lamp)]">OS</span>
      </Link>
      <nav className="space-y-0.5">
        {items.map(i => (
          <Link key={i.href} href={i.href} className="rail-link"
            data-active={path === i.href || path.startsWith(i.href + '/')}>
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
