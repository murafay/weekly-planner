import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

// POST /api/push/unsubscribe  body: { endpoint }
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }
  if (!body.endpoint) return error('endpoint is required');

  const db = getDB();
  await db
    .prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?')
    .bind(body.endpoint, session.sub)
    .run();

  return json({ ok: true });
}
