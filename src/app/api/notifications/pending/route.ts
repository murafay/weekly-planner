import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

// GET /api/notifications/pending
// Returns undelivered queued notifications for the user and marks them
// delivered. Called by the service worker when it receives a push ping.
export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT id, title, body, url, tag FROM pending_notifications
       WHERE user_id = ? AND delivered = 0
       ORDER BY created_at ASC LIMIT 20`
    )
    .bind(session.sub)
    .all<{ id: string; title: string; body: string; url: string; tag: string }>();

  const items = results ?? [];
  if (items.length) {
    const stmt = db.prepare(
      'UPDATE pending_notifications SET delivered = 1 WHERE id = ?'
    );
    await db.batch(items.map((i) => stmt.bind(i.id)));
  }

  return json({ notifications: items });
}
