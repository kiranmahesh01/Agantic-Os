'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Blitz({ workspaceId, posts }: { workspaceId: string; posts: any[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const post = posts[i];

  async function swipe(dir: 'saved' | 'skipped') {
    if (!post || busy) return;
    setBusy(true);
    await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, postId: post.id, swipe: dir })
    });
    setBusy(false);
    if (i + 1 >= posts.length) router.refresh(); else setI(n => n + 1);
  }

  if (!post) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
        <span>Blitz — swipe to approve</span>
        <span>{i + 1} of {posts.length}</span>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 min-h-[280px] flex flex-col">
        <div className="text-xs uppercase tracking-wide text-[var(--accent)]">{post.pillar}</div>
        <div className="text-xl font-semibold mt-3">{post.hook}</div>
        <p className="mt-3 leading-relaxed">{post.caption}</p>
        <p className="mt-4 text-sm text-[var(--accent)]">
          {post.hashtags.map((h: string) => '#' + h.replace(/[#\s]/g, '')).join(' ')}
        </p>
        <p className="mt-auto pt-4 text-sm text-[var(--muted)] border-t border-[var(--line)]">📷 {post.visualNote}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => swipe('skipped')} disabled={busy}
          className="flex-1 rounded-lg border border-[var(--line)] py-3 hover:border-red-700 disabled:opacity-50">Skip</button>
        <button onClick={() => swipe('saved')} disabled={busy}
          className="flex-1 rounded-lg bg-[var(--accent)] text-black font-medium py-3 disabled:opacity-50">Save</button>
      </div>
    </div>
  );
}
