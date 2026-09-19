'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import NotificationSettings from '@/components/NotificationSettings';
import { api } from '@/lib/client';
import { DAYS, DAY_LABELS, CATEGORIES, CATEGORY_META } from '@/lib/categories';
import { PLAN_WEEK_META } from '@/lib/plan';
import type { Template, Category, DayOfWeek } from '@/lib/types';

export const runtime = 'edge';

const PLAN_WEEKS = [1, 2, 3, 4];

interface Draft {
  day_of_week: DayOfWeek;
  time_block: string;
  label: string;
  category: Category;
  plan_week: number;
}

const emptyDraft: Draft = {
  day_of_week: 'Mon',
  time_block: '',
  label: '',
  category: 'work',
  plan_week: 1,
};

export default function SettingsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    api
      .listTemplates()
      .then((data) => setTasks(data.templates))
      .catch((err) => {
        if (err instanceof Error && /authenticated/i.test(err.message)) {
          router.push('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      });
  }, [router]);

  const byDay = useMemo(() => {
    const map: Record<DayOfWeek, Template[]> = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
    };
    for (const t of tasks ?? [])
      if (t.plan_week === activeWeek) map[t.day_of_week]?.push(t);
    for (const d of DAYS) map[d].sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [tasks, activeWeek]);

  const weekCounts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const t of tasks ?? []) c[t.plan_week] = (c[t.plan_week] ?? 0) + 1;
    return c;
  }, [tasks]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.label.trim() || !draft.time_block.trim()) {
      setError('Label and time block are required');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { template } = await api.createTemplate(draft);
      setTasks((prev) => (prev ? [...prev, template] : [template]));
      setDraft({
        ...emptyDraft,
        day_of_week: draft.day_of_week,
        plan_week: draft.plan_week,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(t: Template) {
    setEditingId(t.id);
    setEditDraft({
      day_of_week: t.day_of_week,
      time_block: t.time_block,
      label: t.label,
      category: t.category,
      plan_week: t.plan_week,
    });
  }

  async function saveEdit(id: string) {
    if (!editDraft.label.trim() || !editDraft.time_block.trim()) {
      setError('Label and time block are required');
      return;
    }
    setBusy(true);
    try {
      const { template } = await api.updateTemplate(id, editDraft);
      setTasks((prev) =>
        prev ? prev.map((t) => (t.id === id ? template : t)) : prev
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this task? This also removes its check-off history.'))
      return;
    setBusy(true);
    try {
      await api.deleteTemplate(id);
      setTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  }

  async function move(day: DayOfWeek, index: number, dir: -1 | 1) {
    const list = byDay[day];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;

    const reordered = [...list];
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item);

    // reassign sort_order = position
    const updates = reordered.map((t, i) => ({ ...t, sort_order: i }));
    setTasks((prev) => {
      if (!prev) return prev;
      const others = prev.filter((t) => t.day_of_week !== day);
      return [...others, ...updates];
    });

    try {
      await api.reorder(updates.map((t) => ({ id: t.id, sort_order: t.sort_order })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder');
    }
  }

  return (
    <>
      <TopBar />
      <main className="container">
        <div className="page-head">
          <div>
            <h1>Edit your plan</h1>
            <div className="muted">
              Pick a week, then add, edit, reorder, or remove its tasks. The
              dashboard shows whichever week matches today&apos;s date.
            </div>
          </div>
        </div>

        <NotificationSettings />

        <div className="week-tabs">
          {PLAN_WEEKS.map((w) => (
            <button
              key={w}
              className={`week-tab${activeWeek === w ? ' active' : ''}`}
              style={
                {
                  ['--wc' as any]: PLAN_WEEK_META[w].color,
                } as React.CSSProperties
              }
              onClick={() => {
                setActiveWeek(w);
                setEditingId(null);
                setDraft((d) => ({ ...d, plan_week: w }));
              }}
            >
              <span className="wt-num">Week {w}</span>
              <span className="wt-theme">{PLAN_WEEK_META[w].theme}</span>
              <span className="wt-count">{weekCounts[w] ?? 0}</span>
            </button>
          ))}
        </div>

        {error && <div className="alert">{error}</div>}

        {/* Add task */}
        <form className="card editor editor-5" onSubmit={addTask}>
          <div className="field">
            <label>Week</label>
            <select
              value={draft.plan_week}
              onChange={(e) =>
                setDraft({ ...draft, plan_week: Number(e.target.value) })
              }
            >
              {PLAN_WEEKS.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Day</label>
            <select
              value={draft.day_of_week}
              onChange={(e) =>
                setDraft({ ...draft, day_of_week: e.target.value as DayOfWeek })
              }
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Time block</label>
            <input
              value={draft.time_block}
              onChange={(e) =>
                setDraft({ ...draft, time_block: e.target.value })
              }
              placeholder="09:00–12:00"
            />
          </div>
          <div className="field editor-label">
            <label>Label</label>
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="What are you doing?"
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft({ ...draft, category: e.target.value as Category })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
          <div className="field editor-submit">
            <label>&nbsp;</label>
            <button className="btn btn-primary" disabled={busy}>
              Add task
            </button>
          </div>
        </form>

        {/* Task list grouped by day */}
        {tasks === null && !error ? (
          <div className="spinner-wrap">Loading…</div>
        ) : (
          DAYS.map((day) => (
            <section className="settings-day" key={day}>
              <h2>{DAY_LABELS[day]}</h2>
              {byDay[day].length === 0 ? (
                <div className="day-empty">No tasks yet</div>
              ) : (
                byDay[day].map((t, i) =>
                  editingId === t.id ? (
                    <div
                      className="trow"
                      key={t.id}
                      style={{ gridTemplateColumns: '1fr' }}
                    >
                      <div className="editor editor-5" style={{ padding: 0, margin: 0 }}>
                        <div className="field">
                          <label>Week</label>
                          <select
                            value={editDraft.plan_week}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                plan_week: Number(e.target.value),
                              })
                            }
                          >
                            {PLAN_WEEKS.map((w) => (
                              <option key={w} value={w}>
                                Week {w}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label>Day</label>
                          <select
                            value={editDraft.day_of_week}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                day_of_week: e.target.value as DayOfWeek,
                              })
                            }
                          >
                            {DAYS.map((d) => (
                              <option key={d} value={d}>
                                {DAY_LABELS[d]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label>Time block</label>
                          <input
                            value={editDraft.time_block}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                time_block: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="field editor-label">
                          <label>Label</label>
                          <input
                            value={editDraft.label}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                label: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Category</label>
                          <select
                            value={editDraft.category}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                category: e.target.value as Category,
                              })
                            }
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {CATEGORY_META[c].label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field editor-submit">
                          <label>&nbsp;</label>
                          <div className="row-actions">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveEdit(t.id)}
                              disabled={busy}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="trow"
                      key={t.id}
                      style={
                        {
                          ['--cat' as any]: CATEGORY_META[t.category].color,
                        } as React.CSSProperties
                      }
                    >
                      <div className="reorder">
                        <button
                          className="btn btn-sm"
                          onClick={() => move(day, i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => move(day, i, 1)}
                          disabled={i === byDay[day].length - 1}
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="grow">
                        <div className="task-label">{t.label}</div>
                        <div className="task-meta">
                          <span className="task-time">{t.time_block}</span>
                        </div>
                      </div>
                      <div className="cell-cat">
                        <span
                          className="badge"
                          style={
                            {
                              ['--cat' as any]:
                                CATEGORY_META[t.category].color,
                            } as React.CSSProperties
                          }
                        >
                          {CATEGORY_META[t.category].label}
                        </span>
                      </div>
                      <div className="row-actions">
                        <button
                          className="btn btn-sm"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => remove(t.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </section>
          ))
        )}
        <div style={{ height: 48 }} />
      </main>
    </>
  );
}
