'use client';
import { useState } from 'react';
import Blitz from '@/components/Blitz';

type Profile = {
  product: string; icp: string; tone: string;
  differentiators: string[]; competitors: string[]; contentPillars: string[];
};
type Post = { pillar: string; hook: string; caption: string; hashtags: string[]; visualNote: string };

export default function Home() {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buildProfile() {
    setBusy('Reading the site…'); setError(null); setProfile(null); setPosts(null);
    try {
      const r = await fetch('/api/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showNotes ? { notes } : { url })
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.thin) { setShowNotes(true); setError(d.message); }
        else setError(d.error || 'Something went wrong');
        return;
      }
      setProfile(d.profile);
    } catch (e: any) { setError(e.message); } finally { setBusy(null); }
  }

  async function buildPosts() {
    if (!profile) return;
    setBusy('Writing posts…'); setError(null);
    try {
      const r = await fetch('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, count: 5 })
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      setPosts(d.posts);
    } catch (e: any) { setError(e.message); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Start a new client</h1>
        <p className="text-[var(--muted)] mt-2">
          Paste their website. No website? Answer six questions instead.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-4">
        {!showNotes ? (
          <input
            value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://their-restaurant.com"
            className="w-full rounded-lg bg-black/30 border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
        ) : (
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            rows={10}
            placeholder={"Best-selling dishes?\nWho are the regulars?\nWhat do customers say you do better?\nHow did the place start?\nWho do customers compare you to?\nAnything off-limits?"}
            className="w-full rounded-lg bg-black/30 border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)] font-mono text-sm"
          />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={buildProfile} disabled={!!busy}
            className="rounded-lg bg-[var(--accent)] text-black font-medium px-5 py-2.5 disabled:opacity-50"
          >
            {busy || 'Build brand profile'}
          </button>
          <button
            onClick={() => setShowNotes(s => !s)}
            className="text-sm text-[var(--muted)] underline underline-offset-4"
          >
            {showNotes ? 'Use a website instead' : 'No website — use owner answers'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-amber-400 border border-amber-900/50 bg-amber-950/30 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
      </div>

      {profile && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-4">
          <h2 className="font-semibold">Brand profile</h2>
          <Field label="Product" value={profile.product} />
          <Field label="Customers" value={profile.icp} />
          <Field label="Tone" value={profile.tone} />
          <List label="What makes them different" items={profile.differentiators} />
          <List label="Content pillars" items={profile.contentPillars} />
          <button
            onClick={buildPosts} disabled={!!busy}
            className="rounded-lg bg-[var(--accent)] text-black font-medium px-5 py-2.5 disabled:opacity-50"
          >
            {busy || 'Write 5 posts'}
          </button>
        </div>
      )}

      {posts && <Blitz posts={posts} />}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function List({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => <li key={i} className="text-sm">• {it}</li>)}
      </ul>
    </div>
  );
}
