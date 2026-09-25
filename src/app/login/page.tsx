'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/client';

export const runtime = 'edge';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      const next = search.get('next') || '/dashboard';
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <form className="card auth-card" onSubmit={onSubmit}>
      <h1>Welcome back</h1>
      <p className="sub">Log in to your weekly planner.</p>

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
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div style={{ textAlign: 'right', marginBottom: 14, marginTop: -4 }}>
        <Link href="/forgot" style={{ fontSize: '0.85rem' }}>
          Forgot password?
        </Link>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        disabled={loading}
      >
        {loading ? 'Logging in…' : 'Log in'}
      </button>

      <p className="auth-foot">
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <Suspense fallback={<div className="card auth-card">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
