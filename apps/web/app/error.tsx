'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  const msg = error?.message ?? '';
  const isConnRefused = /ECONNREFUSED|connect ECONNREFUSED|Connection terminated|could not connect/i.test(msg);
  const isNoTable = /relation .* does not exist|does not exist/i.test(msg);
  const isAuthCfg = /BETTER_AUTH|secret/i.test(msg);

  return (
    <div className="max-w-[68ch]">
      <h1 className="text-[24px] font-bold text-[var(--chalk)]">Something broke</h1>

      {isConnRefused && (
        <div className="mt-5 surface p-5">
          <p className="text-[15px] text-[var(--chalk)]">The database isn&rsquo;t reachable.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--chalk-dim)]">
            Postgres isn&rsquo;t running, or it&rsquo;s on a different port. In a terminal:
          </p>
          <pre className="mt-3 text-[13px] text-[var(--lamp)] whitespace-pre-wrap"
               style={{ fontFamily: 'var(--font-mono)' }}>{`open -a Docker      # start Docker Desktop, wait for the whale
cd ~/agency-os
docker compose up -d
docker compose logs db --tail 20`}</pre>
        </div>
      )}

      {isNoTable && (
        <div className="mt-5 surface p-5">
          <p className="text-[15px] text-[var(--chalk)]">The database is running but has no tables.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--chalk-dim)]">Create them:</p>
          <pre className="mt-3 text-[13px] text-[var(--lamp)] whitespace-pre-wrap"
               style={{ fontFamily: 'var(--font-mono)' }}>{`cd ~/agency-os/apps/web
npx drizzle-kit push --force`}</pre>
        </div>
      )}

      {isAuthCfg && (
        <div className="mt-5 surface p-5">
          <p className="text-[15px] text-[var(--chalk)]">Auth isn&rsquo;t configured.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--chalk-dim)]">
            Set BETTER_AUTH_SECRET in apps/web/.env.local and restart.
          </p>
        </div>
      )}

      {!isConnRefused && !isNoTable && !isAuthCfg && (
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--chalk-dim)]">
          The terminal running the app has the full trace. Copy it and we can fix it.
        </p>
      )}

      <details className="mt-6">
        <summary className="text-[13px] text-[var(--chalk-dim)] cursor-pointer">Technical detail</summary>
        <pre className="mt-3 text-[12px] text-[var(--chalk-dim)] whitespace-pre-wrap break-words"
             style={{ fontFamily: 'var(--font-mono)' }}>{msg || 'No message'}{error?.digest ? `\n\ndigest: ${error.digest}` : ''}</pre>
      </details>

      <button onClick={reset} className="btn btn-primary mt-6">Try again</button>
    </div>
  );
}
