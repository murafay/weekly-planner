import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';
import { getWeekStart, normalizeWeekStart } from '@/lib/week';
import { getPlanWeek, planWeekMeta } from '@/lib/plan';
import type { TaskWithCompletion } from '@/lib/types';

export const runtime = 'edge';

// GET /api/completions?week=YYYY-MM-DD
// Returns the current plan-week's template tasks joined with their done-state
// for the given week (defaults to the current week). The plan week is derived
// from the date, so the dashboard auto-advances Week 1 → 4 through the month.
export async function GET(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  const url = new URL(req.url);
  const week = normalizeWeekStart(url.searchParams.get('week')) ?? getWeekStart();
  const planWeek = getPlanWeek(week);

  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT t.id, t.user_id, t.day_of_week, t.time_block, t.label,
              t.category, t.sort_order, t.plan_week,
              COALESCE(c.done, 0) AS done_int
       FROM weekly_templates t
       LEFT JOIN completions c
         ON c.template_id = t.id AND c.week_start_date = ?
       WHERE t.user_id = ? AND t.plan_week = ?
       ORDER BY t.sort_order ASC, t.rowid ASC`
    )
    .bind(week, session.sub, planWeek)
    .all<Record<string, unknown>>();

  const tasks: TaskWithCompletion[] = (results ?? []).map((r) => ({
    id: r.id as string,
    user_id: r.user_id as string,
    day_of_week: r.day_of_week as TaskWithCompletion['day_of_week'],
    time_block: r.time_block as string,
    label: r.label as string,
    category: r.category as TaskWithCompletion['category'],
    sort_order: r.sort_order as number,
    plan_week: Number(r.plan_week),
    done: Number(r.done_int) === 1,
  }));

  const meta = planWeekMeta(planWeek);
  return json({
    week_start_date: week,
    plan_week: planWeek,
    plan_theme: meta.theme,
    plan_color: meta.color,
    tasks,
  });
}

// POST /api/completions  body: { template_id, week_start_date?, done }
// Upserts the completion state for one task in one week.
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  let body: { template_id?: unknown; week_start_date?: unknown; done?: unknown };
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }

  const templateId =
    typeof body.template_id === 'string' ? body.template_id : '';
  const week =
    normalizeWeekStart(body.week_start_date) ?? getWeekStart();
  const done = body.done === true || body.done === 1;

  if (!templateId) return error('template_id is required');

  const db = getDB();

  // Ensure the template belongs to the current user.
  const owned = await db
    .prepare('SELECT id FROM weekly_templates WHERE id = ? AND user_id = ?')
    .bind(templateId, session.sub)
    .first<{ id: string }>();
  if (!owned) return error('Task not found', 404);

  await db
    .prepare(
      `INSERT INTO completions (id, template_id, week_start_date, done, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT (template_id, week_start_date)
       DO UPDATE SET done = excluded.done, updated_at = datetime('now')`
    )
    .bind(crypto.randomUUID(), templateId, week, done ? 1 : 0)
    .run();

  return json({ ok: true, template_id: templateId, week_start_date: week, done });
}
