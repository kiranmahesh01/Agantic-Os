export default function Ticket({ post, compact = false }: { post: any; compact?: boolean }) {
  const tags = (post.hashtags ?? []).map((h: string) => '#' + String(h).replace(/[#\s]/g, ''));
  return (
    <article className="ticket px-6 pt-6 pb-5" style={{ fontFamily: 'var(--font-mono), monospace' }}>
      <div className="flex items-center justify-between text-[11px] tracking-wide text-[var(--ink-dim)]">
        <span>{post.pillar}</span>
        {post.status === 'approved' && <span className="text-[var(--lamp-dim)]">approved</span>}
      </div>

      <h3 className="mt-4 text-[19px] leading-snug font-bold text-[var(--ink)]"
          style={{ fontFamily: 'var(--font-ui), sans-serif' }}>
        {post.hook}
      </h3>

      <p className={`mt-3 leading-relaxed text-[14px] text-[var(--ink)] ${compact ? 'line-clamp-3' : ''}`}>
        {post.caption}
      </p>

      <p className="mt-4 text-[12px] leading-relaxed text-[var(--ink-dim)] break-words">{tags.join('  ')}</p>

      <hr className="ticket-rule" />
      <p className="text-[12px] text-[var(--ink-dim)]">Shoot: {post.visualNote}</p>
    </article>
  );
}
