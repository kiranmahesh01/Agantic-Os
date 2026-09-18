'use client';
import { useState } from 'react';

export default function Upgrade({ plan, disabled }: { plan: string; disabled: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true); setMsg(null);
    const r = await fetch('/api/billing/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan })
    });
    const d = await r.json();
    setBusy(false);
    if (d.url) { window.location.href = d.url; return; }
    setMsg(d.error || 'Checkout could not start.');
  }

  return (
    <>
      <button onClick={go} disabled={disabled || busy} className="btn btn-primary w-full text-[13px] py-2">
        {busy ? 'Opening Stripe' : 'Choose'}
      </button>
      {msg && <p className="mt-2 text-[12px] leading-relaxed text-[var(--chalk-dim)]">{msg}</p>}
    </>
  );
}
