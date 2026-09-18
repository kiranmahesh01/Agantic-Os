'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('up');
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
    if (res.error) { setErr(res.error.message ?? 'That did not work. Check the email and password.'); return; }
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-[var(--line)]">
        <div className="flex items-baseline gap-2">
          <span className="text-[19px] font-bold tracking-tight">Agency</span>
          <span className="text-[19px] font-bold tracking-tight text-[var(--lamp)]">OS</span>
        </div>
        <div className="max-w-[380px]">
          <h1 className="text-[34px] leading-[1.15] font-bold text-[var(--chalk)]">
            Posts that name the dish, not the vibe.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[var(--chalk-dim)]">
            Point it at a restaurant. It reads what they actually serve, writes the
            week&rsquo;s posts, and puts them on the pass for you to clear one at a time.
          </p>
        </div>
        <p className="text-[13px] text-[var(--chalk-dim)]">No website? Six questions to the owner works better anyway.</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-[340px]">
          <h2 className="text-[22px] font-bold text-[var(--chalk)]">
            {mode === 'in' ? 'Sign in' : 'Create your account'}
          </h2>
          <p className="mt-2 text-[14px] text-[var(--chalk-dim)]">
            {mode === 'in' ? 'Back to your clients.' : 'Runs on your own machine. Nothing leaves it.'}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            {mode === 'up' && (
              <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            )}
            <input className="field" type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
            <input className="field" type="password" required minLength={8}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setPassword(e.target.value)} placeholder="Password, 8 characters or more" />
            {err && <p className="text-[13px] text-[var(--bad)]">{err}</p>}
            <button disabled={busy} className="btn btn-primary w-full">
              {busy ? 'One moment' : mode === 'in' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button onClick={() => { setMode(m => m === 'in' ? 'up' : 'in'); setErr(null); }}
            className="mt-5 text-[13px] text-[var(--chalk-dim)] hover:text-[var(--chalk)]">
            {mode === 'in' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
