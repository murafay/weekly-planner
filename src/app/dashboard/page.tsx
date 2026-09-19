'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { api } from '@/lib/client';
import { DAYS, DAY_LABELS, CATEGORY_META } from '@/lib/categories';
import { formatWeekRange } from '@/lib/week';
import type { TaskWithCompletion, DayOfWeek } from '@/lib/types';

export const runtime = 'edge';

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithCompletion[] | null>(null);
  const [week, setWeek] = useState<string>('');
  const [planWeek, setPlanWeek] = useState<number>(0);
  const [planTheme, setPlanTheme] = useState<string>('');
  const [planColor, setPlanColor] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .week()
      .then((data) => {
        if (!active) return;
        setTasks(data.tasks);
        setWeek(data.week_start_date);
        setPlanWeek(data.plan_week);
        setPlanTheme(data.plan_theme);
        setPlanColor(data.plan_color);
      })
      .catch((err) => {
        if (err instanceof Error && /authenticated/i.test(err.message)) {
          router.push('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      });
    return () => {
      active = false;
    };
  }, [router]);

  const byDay = useMemo(() => {
    const map: Record<DayOfWeek, TaskWithCompletion[]> = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
    };
    for (const t of tasks ?? []) {
      if (map[t.day_of_week]) map[t.day_of_week].push(t);
    }
    return map;
  }, [tasks]);

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.done).length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function toggle(task: TaskWithCompletion) {
    const next = !task.done;
    setTasks((prev) =>
      prev
        ? prev.map((t) => (t.id === task.id ? { ...t, done: next } : t))
        : prev
    );
    try {
      await api.setDone(task.id, next, week);
    } catch {
      // revert on failure
      setTasks((prev) =>
        prev
          ? prev.map((t) => (t.id === task.id ? { ...t, done: !next } : t))
          : prev
      );
    }
  }

  return (
    <>
      <TopBar />
      <main className="container">
        <div className="page-head">
          <div>
            <h1>This week</h1>
            <div className="muted dash-sub">
              <span>{week ? formatWeekRange(week) : ''}</span>
              {planWeek ? (
                <span
                  className="planpill"
                  style={{ ['--pc' as any]: planColor } as React.CSSProperties}
                >
                  Week {planWeek} of 4 · {planTheme}
                </span>
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/calendar" className="btn">
              Month view
            </Link>
            <Link href="/settings" className="btn">
              Edit tasks
            </Link>
          </div>
        </div>

        {error && <div className="alert">{error}</div>}

        {tasks === null && !error ? (
          <div className="spinner-wrap">Loading your week…</div>
        ) : total === 0 ? (
          <div className="card empty-state">
            <p>You don&apos;t have any tasks yet.</p>
            <Link href="/settings" className="btn btn-primary">
              Add your first task
            </Link>
          </div>
        ) : (
          <>
            <div className="progress">
              <div className="progress-meta">
                <span>Weekly progress</span>
                <span>
                  {done} / {total} done · {pct}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="week-grid">
              {DAYS.map((day) => (
                <section className="day-col" key={day}>
                  <h2>{DAY_LABELS[day]}</h2>
                  <div className="day-sub">
                    {byDay[day].length}{' '}
                    {byDay[day].length === 1 ? 'task' : 'tasks'}
                  </div>
                  {byDay[day].length === 0 ? (
                    <div className="day-empty">Nothing scheduled</div>
                  ) : (
                    byDay[day].map((t) => (
                      <label
                        key={t.id}
                        className={`task${t.done ? ' done' : ''}`}
                        style={
                          {
                            ['--cat' as any]: CATEGORY_META[t.category].color,
                          } as React.CSSProperties
                        }
                      >
                        <input
                          type="checkbox"
                          className="task-check"
                          checked={t.done}
                          onChange={() => toggle(t)}
                        />
                        <div className="task-body">
                          <div className="task-label">{t.label}</div>
                          <div className="task-meta">
                            <span className="task-time">{t.time_block}</span>
                            <span className="badge">
                              {CATEGORY_META[t.category].label}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
