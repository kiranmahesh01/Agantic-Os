'use client';
import { useState } from 'react';

export default function Upgrade({ plan, disabled }: { plan: string; disabled: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true); setMsg(null);
    const r = await fetch('/api/billing/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    const d = await r.json();
    setBusy(false);
    if (d.url) { window.location.href = d.url; return; }
    setMsg(d.error || 'Could not start checkout');
  }

  return (
    <div className="mt-4">
      <button onClick={go} disabled={disabled || busy}
        className="w-full rounded-lg bg-[var(--accent)] text-black font-medium py-2 text-sm disabled:opacity-40">
        {busy ? 'Redirecting…' : 'Upgrade'}
      </button>
      {msg && <p className="text-xs text-amber-400 mt-2">{msg}</p>}
    </div>
  );
}
