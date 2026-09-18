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
    if (!brandName.trim()) return;
    setBusy(true);
    await fetch('/api/workspaces', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName, websiteUrl })
    });
    setBrandName(''); setWebsiteUrl(''); setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={add} className="surface p-4 flex flex-col sm:flex-row gap-3">
      <input className="field flex-1" value={brandName} onChange={e => setBrandName(e.target.value)}
        placeholder="Restaurant name" />
      <input className="field flex-1" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
        placeholder="Website, if they have one" />
      <button disabled={busy || !brandName.trim()} className="btn btn-primary whitespace-nowrap">
        {busy ? 'Adding' : 'Add client'}
      </button>
    </form>
  );
}
