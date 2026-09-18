'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClient() {
  const router = useRouter();
  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName) return;
    setBusy(true);
    await fetch('/api/workspaces', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName, websiteUrl })
    });
    setBrandName(''); setWebsiteUrl(''); setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={add} className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 flex flex-col sm:flex-row gap-3">
      <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Client name (e.g. NTR Biryani)"
        className="flex-1 rounded-lg bg-black/30 border border-[var(--line)] px-4 py-2.5 outline-none focus:border-[var(--accent)]" />
      <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website (optional)"
        className="flex-1 rounded-lg bg-black/30 border border-[var(--line)] px-4 py-2.5 outline-none focus:border-[var(--accent)]" />
      <button disabled={busy} className="rounded-lg bg-[var(--accent)] text-black font-medium px-5 py-2.5 disabled:opacity-50">
        {busy ? 'Adding…' : 'Add client'}
      </button>
    </form>
  );
}
