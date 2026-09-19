'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import ThemeToggle from './ThemeToggle';

export default function TopBar({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/dashboard" className="brand">
          🗓️ Weekly Planner
        </Link>
        <nav className="nav">
          <Link
            href="/dashboard"
            className={pathname === '/dashboard' ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link
            href="/calendar"
            className={pathname === '/calendar' ? 'active' : ''}
          >
            Calendar
          </Link>
          <Link
            href="/settings"
            className={pathname === '/settings' ? 'active' : ''}
          >
            Settings
          </Link>
          <ThemeToggle />
          <button className="btn btn-sm" onClick={logout} title={email}>
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
