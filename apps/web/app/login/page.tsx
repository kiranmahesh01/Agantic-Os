'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = mode === 'in'
      ? await signIn.email({ email, password })
      : await signUp.email({ email, password, name: name || email.split('@')[0] });
    setBusy(false);
    if (res.error) { setErr(res.error.message ?? 'Failed'); return; }
    router.push('/dashboard');
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === 'in' ? 'Sign in' : 'Create your account'}
      </h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === 'up' && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            className="w-full rounded-lg bg-black/30 border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)]" />
        )}
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full rounded-lg bg-black/30 border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)]" />
        <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (8+ characters)"
          className="w-full rounded-lg bg-black/30 border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)]" />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[var(--accent)] text-black font-medium py-3 disabled:opacity-50">
          {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <button onClick={() => setMode(m => m === 'in' ? 'up' : 'in')}
        className="mt-4 text-sm text-[var(--muted)] underline underline-offset-4">
        {mode === 'in' ? 'No account? Create one' : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
