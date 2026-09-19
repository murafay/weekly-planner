import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

// POST /api/templates/reorder
// body: { items: [{ id: string, sort_order: number }] }
// Updates sort_order for the given tasks (only those owned by the user).
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  let body: { items?: { id?: unknown; sort_order?: unknown }[] };
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }

  if (!Array.isArray(body.items)) return error('items must be an array');

  const items = body.items
    .map((it) => ({ id: it?.id, sort_order: it?.sort_order }))
    .filter(
      (it): it is { id: string; sort_order: number } =>
        typeof it.id === 'string' && Number.isFinite(Number(it.sort_order))
    );

  if (items.length === 0) return json({ ok: true });

  const db = getDB();
  const stmt = db.prepare(
    'UPDATE weekly_templates SET sort_order = ? WHERE id = ? AND user_id = ?'
  );
  await db.batch(
    items.map((it) =>
      stmt.bind(Math.trunc(Number(it.sort_order)), it.id, session.sub)
    )
  );

  return json({ ok: true });
}
