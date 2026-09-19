import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';
import { getWeekStart } from '@/lib/week';
import {
  PLAN_WEEKS,
  weekStartForPlanWeek,
  getPlanWeek,
  planWeekMeta,
} from '@/lib/plan';
import type { TaskWithCompletion } from '@/lib/types';

export const runtime = 'edge';

// GET /api/month — the full 4-week plan, each week joined with its completion
// state for that week's real calendar dates. Powers the Calendar view.
export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  const db = getDB();
  const currentWeekStart = getWeekStart();
  const currentPlanWeek = getPlanWeek(currentWeekStart);

  const weeks = [];
  for (let n = 1; n <= PLAN_WEEKS; n++) {
    const weekStart = weekStartForPlanWeek(n);
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
      .bind(weekStart, session.sub, n)
      .all<Record<string, unknown>>();

    const tasks: TaskWithCompletion[] = (results ?? []).map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      day_of_week: r.day_of_week as TaskWithCompletion['day_of_week'],
      time_block: r.time_block as string,
      label: r.label as string,
      category: r.category as TaskWithCompletion['category'],
      sort_order: r.sort_order as number,
      plan_week: n,
      done: Number(r.done_int) === 1,
    }));

    const meta = planWeekMeta(n);
    weeks.push({
      plan_week: n,
      week_start_date: weekStart,
      theme: meta.theme,
      tools: meta.tools,
      color: meta.color,
      is_current: n === currentPlanWeek,
      tasks,
    });
  }

  return json({ current_plan_week: currentPlanWeek, weeks });
}
