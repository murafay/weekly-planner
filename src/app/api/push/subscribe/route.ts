import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

// POST /api/push/subscribe
// body: { subscription: PushSubscriptionJSON, timezone?: string }
// Stores the device subscription and ensures a notification_prefs row exists.
export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  let body: {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    timezone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return error('Invalid subscription');

  const tz =
    typeof body.timezone === 'string' && body.timezone.length <= 64
      ? body.timezone
      : 'Asia/Karachi';

  const db = getDB();

  // Upsert the subscription (endpoint is unique; re-subscribing updates keys/owner).
  await db
    .prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
    )
    .bind(crypto.randomUUID(), session.sub, endpoint, p256dh, auth)
    .run();

  // Ensure prefs exist (default on), and set timezone.
  await db
    .prepare(
      `INSERT INTO notification_prefs (user_id, timezone)
       VALUES (?, ?)
       ON CONFLICT (user_id) DO UPDATE SET timezone = excluded.timezone,
         updated_at = datetime('now')`
    )
    .bind(session.sub, tz)
    .run();

  return json({ ok: true });
}
