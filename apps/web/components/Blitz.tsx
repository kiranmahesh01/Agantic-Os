'use client';
import { useState } from 'react';

type Post = { pillar: string; hook: string; caption: string; hashtags: string[]; visualNote: string };

export default function Blitz({ posts }: { posts: Post[] }) {
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState<Post[]>([]);
  const [skipped, setSkipped] = useState<Post[]>([]);

  const post = posts[i];
  const done = i >= posts.length;

  function swipe(dir: 'save' | 'skip') {
    if (!post) return;
    if (dir === 'save') setSaved(s => [...s, post]);
    else setSkipped(s => [...s, post]);
    setI(n => n + 1);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4">
        <h2 className="font-semibold">Review done — {saved.length} saved, {skipped.length} skipped</h2>
        {saved.map((p, n) => (
          <div key={n} className="border-t border-[var(--line)] pt-4">
            <div className="font-medium">{p.hook}</div>
            <p className="text-sm text-[var(--muted)] mt-1">{p.caption}</p>
            <p className="text-xs text-[var(--accent)] mt-2">
              {p.hashtags.map(h => '#' + h.replace(/[#\s]/g, '')).join(' ')}
            </p>
          </div>
        ))}
        {saved.length === 0 && (
          <p className="text-sm text-[var(--muted)]">Nothing saved. Generate a new set.</p>
        )}
      </div>
    );
  }

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
          {post.hashtags.map(h => '#' + h.replace(/[#\s]/g, '')).join(' ')}
        </p>
        <p className="mt-auto pt-4 text-sm text-[var(--muted)] border-t border-[var(--line)]">
          📷 {post.visualNote}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => swipe('skip')}
          className="flex-1 rounded-lg border border-[var(--line)] py-3 hover:border-red-700"
        >
          Skip
        </button>
        <button
          onClick={() => swipe('save')}
          className="flex-1 rounded-lg bg-[var(--accent)] text-black font-medium py-3"
        >
          Save
        </button>
      </div>
    </div>
  );
}
