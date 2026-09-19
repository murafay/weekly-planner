'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { api } from '@/lib/client';
import { DAYS, CATEGORY_META } from '@/lib/categories';
import type { TaskWithCompletion, DayOfWeek } from '@/lib/types';

export const runtime = 'edge';

interface WeekBlock {
  plan_week: number;
  week_start_date: string;
  theme: string;
  tools: string;
  color: string;
  is_current: boolean;
  tasks: TaskWithCompletion[];
}

function cellDate(weekStart: string, dayIndex: number): { d: number; mo: string } {
  const dt = new Date(weekStart + 'T00:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + dayIndex);
  return {
    d: dt.getUTCDate(),
    mo: dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const [weeks, setWeeks] = useState<WeekBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .month()
      .then((data) => setWeeks(data.weeks))
      .catch((err) => {
        if (err instanceof Error && /authenticated/i.test(err.message)) {
          router.push('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [router]);

  const totals = useMemo(() => {
    const all = (weeks ?? []).flatMap((w) => w.tasks);
    const done = all.filter((t) => t.done).length;
    return { done, total: all.length };
  }, [weeks]);

  async function toggle(week: WeekBlock, task: TaskWithCompletion) {
    const next = !task.done;
    setWeeks((prev) =>
      prev
        ? prev.map((w) =>
            w.plan_week === week.plan_week
              ? {
                  ...w,
                  tasks: w.tasks.map((t) =>
                    t.id === task.id ? { ...t, done: next } : t
                  ),
                }
              : w
          )
        : prev
    );
    try {
      await api.setDone(task.id, next, week.week_start_date);
    } catch {
      setWeeks((prev) =>
        prev
          ? prev.map((w) =>
              w.plan_week === week.plan_week
                ? {
                    ...w,
                    tasks: w.tasks.map((t) =>
                      t.id === task.id ? { ...t, done: !next } : t
                    ),
                  }
                : w
          )
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
            <h1>Your month</h1>
            <div className="muted">
              The full 4-week plan · {totals.done}/{totals.total} done overall
            </div>
          </div>
          <Link href="/dashboard" className="btn">
            This week
          </Link>
        </div>

        {error && <div className="alert">{error}</div>}

        {weeks === null && !error ? (
          <div className="spinner-wrap">Loading your month…</div>
        ) : (
          <div className="cal-scroll">
            <div className="cal-grid">
              {DAYS.map((d) => (
                <div className="cal-dow" key={d}>
                  {d}
                </div>
              ))}

              {(weeks ?? []).map((w) => {
                const byDay: Record<DayOfWeek, TaskWithCompletion[]> = {
                  Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
                };
                for (const t of w.tasks) byDay[t.day_of_week]?.push(t);
                const wDone = w.tasks.filter((t) => t.done).length;

                return (
                  <div className="cal-week-contents" key={w.plan_week}>
                    <div
                      className={`cal-band${w.is_current ? ' current' : ''}`}
                      style={{ ['--wc' as any]: w.color } as React.CSSProperties}
                    >
                      <span className="wk">Week {w.plan_week}</span>
                      <span className="th">{w.theme}</span>
                      {w.is_current && <span className="now">This week</span>}
                      <span className="prog">
                        {wDone}/{w.tasks.length}
                      </span>
                    </div>

                    {DAYS.map((day, i) => {
                      const { d, mo } = cellDate(w.week_start_date, i);
                      const isWeekend = day === 'Sat' || day === 'Sun';
                      return (
                        <div
                          className={`cal-cell${isWeekend ? ' we' : ''}`}
                          style={
                            { ['--wc' as any]: w.color } as React.CSSProperties
                          }
                          key={day}
                        >
                          <div className="cal-date">
                            <span>{d}</span>
                            <span className="mo">{i === 0 ? mo : ''}</span>
                          </div>
                          {byDay[day].map((t) => (
                            <label
                              key={t.id}
                              className={`cal-ev${t.done ? ' done' : ''}`}
                              style={
                                {
                                  ['--cc' as any]:
                                    CATEGORY_META[t.category].color,
                                } as React.CSSProperties
                              }
                            >
                              <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() => toggle(w, t)}
                              />
                              <span className="cal-ev-body">
                                <span className="cal-ev-time">
                                  {t.time_block}
                                </span>
                                <span className="cal-ev-label">{t.label}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ height: 48 }} />
      </main>
    </>
  );
}
