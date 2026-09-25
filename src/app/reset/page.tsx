'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setDone(true);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card auth-card">
        <h1>Reset password</h1>
        <div className="alert">
          This reset link is missing its token. Request a new one.
        </div>
        <p className="auth-foot">
          <Link href="/forgot">Send a new link</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h1>Set a new password</h1>
      {done ? (
        <p className="sub">
          ✓ Password updated. Redirecting you to log in…
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          <p className="sub">Choose a new password for your account.</p>
          {error && <div className="alert">{error}</div>}
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
          <p className="auth-foot">
            <Link href="/login">Back to log in</Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function ResetPage() {
  return (
    <div className="auth-wrap">
      <Suspense fallback={<div className="card auth-card">Loading…</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
