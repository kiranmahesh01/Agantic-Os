'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Blitz from './Blitz';
import Ticket from './Ticket';
import Schedule from './Schedule';

export default function ClientWorkspace({ workspace, profile, posts }: any) {
  const router = useRouter();
  const [url, setUrl] = useState(workspace.websiteUrl || '');
  const [notes, setNotes] = useState('');
  const [useNotes, setUseNotes] = useState(!workspace.websiteUrl);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, body: any, label: string) {
    setBusy(label); setError(null);
    const r = await fetch(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const d = await r.json(); setBusy(null);
    if (!r.ok) { if (d.thin) setUseNotes(true); setError(d.message || d.error); return false; }
    router.refresh(); return true;
  }

  const pending = posts.filter((p: any) => p.swipe === 'pending');
  const approved = posts.filter((p: any) => p.swipe === 'saved');

  return (
    <div className="space-y-9">
      <header>
        <h1 className="text-[27px] font-bold tracking-tight text-[var(--chalk)]">{workspace.brandName}</h1>
        <p className="mt-1.5 text-[14px] text-[var(--chalk-dim)]">
          {workspace.websiteUrl || 'No website on file'}
        </p>
      </header>

      {!profile && (
        <section className="surface p-6 max-w-[620px]">
          <h2 className="text-[16px] font-semibold text-[var(--chalk)]">What does this place actually serve?</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--chalk-dim)]">
            {useNotes
              ? 'Ask the owner these and paste their answers in their own words.'
              : 'Their website is a decent start. Thin sites get caught before they waste a credit.'}
          </p>

          <div className="mt-5">
            {!useNotes ? (
              <input className="field" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://their-site.com" />
            ) : (
              <textarea className="field" rows={11} value={notes} onChange={e => setNotes(e.target.value)}
                style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 13 }}
                placeholder={`Three best-selling dishes, exact menu names?\n\nWho comes in most, and when?\n\nWhat do regulars say you do better?\n\nHow did the place start?\n\nWho do customers compare you to?\n\nAnything you never want posted?`} />
            )}
          </div>

          {error && (
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--lamp)] border-l-2 border-[var(--lamp-dim)] pl-3">
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4">
            <button className="btn btn-primary"
              disabled={!!busy || (useNotes ? notes.trim().length < 80 : !url.trim())}
              onClick={() => call('/api/profile', { workspaceId: workspace.id, ...(useNotes ? { notes } : { url }) }, 'Reading')}>
              {busy || 'Build the profile'}
            </button>
            <button onClick={() => { setUseNotes(s => !s); setError(null); }}
              className="text-[13px] text-[var(--chalk-dim)] hover:text-[var(--chalk)]">
              {useNotes ? 'Use their website instead' : 'No website — ask the owner'}
            </button>
          </div>
        </section>
      )}

      {profile && (
        <section className="surface p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[16px] font-semibold text-[var(--chalk)]">What we know about them</h2>
            <span className="text-[13px] text-[var(--chalk-dim)]">
              {profile.source === 'website' ? 'from their website' : 'from the owner'}
            </span>
          </div>

          <dl className="mt-5 space-y-4 max-w-[70ch]">
            <Row k="Serves" v={profile.product} />
            <Row k="Customers" v={profile.icp} />
            <Row k="Voice" v={profile.tone} />
          </dl>

          {profile.differentiators?.length > 0 && (
            <ul className="mt-5 space-y-1.5 max-w-[70ch]">
              {profile.differentiators.map((d: string, n: number) => (
                <li key={n} className="text-[14px] text-[var(--chalk)] pl-4 relative">
                  <span className="absolute left-0 text-[var(--lamp-dim)]">·</span>{d}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center gap-4">
            <button className="btn btn-primary" disabled={!!busy}
              onClick={() => call('/api/posts', { workspaceId: workspace.id, count: 5 }, 'Writing')}>
              {busy || 'Write five posts'}
            </button>
            {error && <span className="text-[13px] text-[var(--bad)]">{error}</span>}
          </div>
        </section>
      )}

      {pending.length > 0 && <Blitz workspaceId={workspace.id} posts={pending} />}

      {approved.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-[var(--chalk)] mb-5">
            Approved &mdash; {approved.length} ready to send
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((p: any) => (
              <div key={p.id}>
                <Ticket post={p} compact />
                <Schedule workspaceId={workspace.id} post={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-4">
      <dt className="text-[13px] text-[var(--chalk-dim)] pt-0.5">{k}</dt>
      <dd className="text-[14px] leading-relaxed text-[var(--chalk)]">{v}</dd>
    </div>
  );
}
