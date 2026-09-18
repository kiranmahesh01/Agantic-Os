'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'linkedin'];

export default function Schedule({ workspaceId, post }: { workspaceId: string; post: any }) {
  const router = useRouter();
  const [when, setWhen] = useState(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
  );
  const [platform, setPlatform] = useState(post.platform ?? 'instagram');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save() {
    setBusy(true);
    await fetch('/api/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, postId: post.id, scheduledAt: when || null, platform })
    });
    setBusy(false);
    router.refresh();
  }

  function copy() {
    const tags = (post.hashtags ?? []).map((h: string) => '#' + String(h).replace(/[#\s]/g, '')).join(' ');
    navigator.clipboard.writeText(`${post.hook}\n\n${post.caption}\n\n${tags}`);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)}
        className="field text-[12px] py-1.5 w-auto flex-1 min-w-[180px]" />
      <select value={platform} onChange={e => setPlatform(e.target.value)}
        className="field text-[12px] py-1.5 w-auto">
        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <button onClick={save} disabled={busy} className="btn btn-quiet text-[12px] py-1.5 px-3">
        {busy ? 'Saving' : post.scheduledAt ? 'Update' : 'Schedule'}
      </button>
      <button onClick={copy} className="btn btn-quiet text-[12px] py-1.5 px-3">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
