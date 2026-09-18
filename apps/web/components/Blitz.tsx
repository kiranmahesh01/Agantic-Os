'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Ticket from './Ticket';

export default function Blitz({ workspaceId, posts }: { workspaceId: string; posts: any[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const post = posts[i];

  async function decide(swipe: 'saved' | 'skipped') {
    if (!post || busy) return;
    setBusy(true);
    await fetch('/api/swipe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, postId: post.id, swipe })
    });
    setBusy(false);
    if (i + 1 >= posts.length) router.refresh(); else setI(n => n + 1);
  }

  if (!post) return null;

  return (
    <section className="max-w-[460px]">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-[15px] font-semibold text-[var(--chalk)]">On the pass</h2>
        <span className="text-[13px] text-[var(--chalk-dim)]">{posts.length - i} to review</span>
      </div>

      <Ticket post={post} />

      <div className="flex gap-3 mt-6">
        <button onClick={() => decide('skipped')} disabled={busy} className="btn btn-quiet flex-1">
          Not this one
        </button>
        <button onClick={() => decide('saved')} disabled={busy} className="btn btn-primary flex-1">
          Use it
        </button>
      </div>
      <p className="mt-3 text-[13px] text-[var(--chalk-dim)]">
        Check every dish and price against their real menu before you send anything.
      </p>
    </section>
  );
}
