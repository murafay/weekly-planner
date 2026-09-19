import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';
import { isCategory, isDay } from '@/lib/categories';
import { normalizePlanWeek } from '@/lib/plan';
import type { Template } from '@/lib/types';

export const runtime = 'edge';

interface Ctx {
  params: Promise<{ id: string }>;
}

// PUT /api/templates/:id — update a task (owned by the current user)
export async function PUT(req: Request, ctx: Ctx): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  const { id } = await ctx.params;

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
  const res = await db
    .prepare(
      `UPDATE weekly_templates
         SET day_of_week = ?, time_block = ?, label = ?, category = ?, plan_week = ?
       WHERE id = ? AND user_id = ?`
    )
    .bind(day_of_week, time_block, label, category, plan_week, id, session.sub)
    .run();

  if (!res.meta.changes) return error('Task not found', 404);

  const template = await db
    .prepare(
      `SELECT id, user_id, day_of_week, time_block, label, category, sort_order, plan_week
       FROM weekly_templates WHERE id = ? AND user_id = ?`
    )
    .bind(id, session.sub)
    .first<Template>();

  return json({ template });
}

// DELETE /api/templates/:id — delete a task (cascades to its completions)
export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  const { id } = await ctx.params;
  const db = getDB();
  const res = await db
    .prepare('DELETE FROM weekly_templates WHERE id = ? AND user_id = ?')
    .bind(id, session.sub)
    .run();

  if (!res.meta.changes) return error('Task not found', 404);
  return json({ ok: true });
}
