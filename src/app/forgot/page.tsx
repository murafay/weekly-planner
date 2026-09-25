'use client';

import { useState } from 'react';
import Link from 'next/link';

export const runtime = 'edge';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>Forgot password</h1>
        {sent ? (
          <>
            <p className="sub">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a
              password reset link. Check your inbox (and spam) — the link expires
              in 1 hour.
            </p>
            <p className="auth-foot">
              <Link href="/login">Back to log in</Link>
            </p>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="sub">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
            {error && <div className="alert">{error}</div>}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="auth-foot">
              Remembered it? <Link href="/login">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
