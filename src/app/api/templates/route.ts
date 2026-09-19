import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';
import { isCategory, isDay } from '@/lib/categories';
import { normalizePlanWeek } from '@/lib/plan';
import type { Template } from '@/lib/types';

export const runtime = 'edge';

// GET /api/templates — all of the current user's template tasks
export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT id, user_id, day_of_week, time_block, label, category, sort_order, plan_week
       FROM weekly_templates
       WHERE user_id = ?
       ORDER BY plan_week ASC, sort_order ASC, rowid ASC`
    )
    .bind(session.sub)
    .all<Template>();

  return json({ templates: results ?? [] });
}

// POST /api/templates — create a new template task
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }

  const day_of_week = body.day_of_week;
  const time_block =
    typeof body.time_block === 'string' ? body.time_block.trim() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const category = body.category;
  const plan_week = normalizePlanWeek(body.plan_week, 1);

  if (!isDay(day_of_week)) return error('Invalid day_of_week');
  if (!isCategory(category)) return error('Invalid category');
  if (!label) return error('Label is required');
  if (!time_block) return error('Time block is required');

  const db = getDB();

  // Place new task at the end of its day within its plan week.
  const max = await db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), -1) AS m
       FROM weekly_templates WHERE user_id = ? AND plan_week = ? AND day_of_week = ?`
    )
    .bind(session.sub, plan_week, day_of_week)
    .first<{ m: number }>();
  const sort_order = (max?.m ?? -1) + 1;

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO weekly_templates
         (id, user_id, day_of_week, time_block, label, category, sort_order, plan_week)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, session.sub, day_of_week, time_block, label, category, sort_order, plan_week)
    .run();

  const template: Template = {
    id,
    user_id: session.sub,
    day_of_week,
    time_block,
    label,
    category,
    sort_order,
    plan_week,
  };
  return json({ template }, 201);
}
