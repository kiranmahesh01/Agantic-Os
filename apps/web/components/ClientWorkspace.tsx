'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Blitz from './Blitz';

export default function ClientWorkspace({ workspace, profile, posts }: any) {
  const router = useRouter();
  const [url, setUrl] = useState(workspace.websiteUrl || '');
  const [notes, setNotes] = useState('');
  const [useNotes, setUseNotes] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buildProfile() {
    setBusy('Reading…'); setError(null);
    const r = await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: workspace.id, ...(useNotes ? { notes } : { url }) })
    });
    const d = await r.json(); setBusy(null);
    if (!r.ok) { if (d.thin) setUseNotes(true); setError(d.message || d.error); return; }
    router.refresh();
  }

  async function makePosts() {
    setBusy('Writing posts…'); setError(null);
    const r = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: workspace.id, count: 5 })
    });
    const d = await r.json(); setBusy(null);
    if (!r.ok) { setError(d.error); return; }
    router.refresh();
  }

  const pending = posts.filter((p: any) => p.swipe === 'pending');
  const saved = posts.filter((p: any) => p.swipe === 'saved');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{workspace.brandName}</h1>
        <p className="text-[var(--muted)] mt-1">{workspace.websiteUrl || 'No website'}</p>
      </div>

      {!profile && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-4">
          <h2 className="font-semibold">Build the brand profile</h2>
          {!useNotes ? (
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://their-site.com"
              className="w-full rounded-lg bg-black/30 border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)]" />
          ) : (
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={10}
              placeholder={"Best-selling dishes?\nWho are the regulars?\nWhat do you do better?\nHow did it start?\nWho do customers compare you to?\nAnything off-limits?"}
              className="w-full rounded-lg bg-black/30 border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)] font-mono text-sm" />
          )}
          <div className="flex items-center gap-3">
            <button onClick={buildProfile} disabled={!!busy}
              className="rounded-lg bg-[var(--accent)] text-black font-medium px-5 py-2.5 disabled:opacity-50">
              {busy || 'Build profile'}
            </button>
            <button onClick={() => setUseNotes(s => !s)} className="text-sm text-[var(--muted)] underline underline-offset-4">
              {useNotes ? 'Use a website' : 'No website — owner answers'}
            </button>
          </div>
          {error && <p className="text-sm text-amber-400">{error}</p>}
        </div>
      )}

      {profile && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Brand profile</h2>
            <span className="text-xs text-[var(--muted)]">
              from {profile.source === 'website' ? 'their website' : 'owner answers'}
            </span>
          </div>
          <p className="text-sm"><span className="text-[var(--muted)]">Product: </span>{profile.product}</p>
          <p className="text-sm"><span className="text-[var(--muted)]">Customers: </span>{profile.icp}</p>
          <p className="text-sm"><span className="text-[var(--muted)]">Tone: </span>{profile.tone}</p>
          <button onClick={makePosts} disabled={!!busy}
            className="rounded-lg bg-[var(--accent)] text-black font-medium px-5 py-2.5 disabled:opacity-50">
            {busy || 'Generate 5 posts'}
          </button>
          {error && <p className="text-sm text-amber-400">{error}</p>}
        </div>
      )}

      {pending.length > 0 && <Blitz workspaceId={workspace.id} posts={pending} />}

      {saved.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-4">
          <h2 className="font-semibold">Approved — {saved.length}</h2>
          {saved.map((p: any) => (
            <div key={p.id} className="border-t border-[var(--line)] pt-4">
              <div className="font-medium">{p.hook}</div>
              <p className="text-sm text-[var(--muted)] mt-1">{p.caption}</p>
              <p className="text-xs text-[var(--accent)] mt-2">
                {p.hashtags.map((h: string) => '#' + h.replace(/[#\s]/g, '')).join(' ')}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">📷 {p.visualNote}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
