import { getDB } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

interface Prefs {
  enabled: number;
  morning_digest: number;
  morning_time: string;
  task_nudge: number;
  lead_minutes: number;
  timezone: string;
}

const DEFAULTS: Prefs = {
  enabled: 1,
  morning_digest: 1,
  morning_time: '07:00',
  task_nudge: 1,
  lead_minutes: 10,
  timezone: 'Asia/Karachi',
};

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  const db = getDB();
  const row = await db
    .prepare(
      `SELECT enabled, morning_digest, morning_time, task_nudge, lead_minutes, timezone
       FROM notification_prefs WHERE user_id = ?`
    )
    .bind(session.sub)
    .first<Prefs>();

  return json({ prefs: row ?? DEFAULTS, exists: !!row });
}

export async function PUT(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return error('Invalid request body');
  }

  const bool = (v: unknown, d: number) => (v === undefined ? d : v ? 1 : 0);
  const enabled = bool(b.enabled, 1);
  const morning_digest = bool(b.morning_digest, 1);
  const task_nudge = bool(b.task_nudge, 1);
  const morning_time =
    typeof b.morning_time === 'string' && /^\d{2}:\d{2}$/.test(b.morning_time)
      ? b.morning_time
      : '07:00';
  let lead = Math.trunc(Number(b.lead_minutes));
  if (!Number.isFinite(lead) || lead < 0 || lead > 120) lead = 10;
  const timezone =
    typeof b.timezone === 'string' && b.timezone.length <= 64
      ? b.timezone
      : 'Asia/Karachi';

  const db = getDB();
  await db
    .prepare(
      `INSERT INTO notification_prefs
         (user_id, enabled, morning_digest, morning_time, task_nudge, lead_minutes, timezone, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT (user_id) DO UPDATE SET
         enabled = excluded.enabled,
         morning_digest = excluded.morning_digest,
         morning_time = excluded.morning_time,
         task_nudge = excluded.task_nudge,
         lead_minutes = excluded.lead_minutes,
         timezone = excluded.timezone,
         updated_at = datetime('now')`
    )
    .bind(session.sub, enabled, morning_digest, morning_time, task_nudge, lead, timezone)
    .run();

  return json({ ok: true });
}
