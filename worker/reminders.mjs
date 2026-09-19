// Scheduled Cloudflare Worker: sends the morning digest and per-task nudges.
// Runs on a cron trigger, computes what's due per user (in their timezone),
// queues the messages in D1, and sends a Web Push ping to their devices.
// The service worker then fetches the queued messages and displays them.

import { SignJWT, importJWK } from 'jose';

const PLAN_ANCHOR_MONDAY = '2026-08-31';
const PLAN_WEEKS = 4;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
const WINDOW_MIN = 5; // cron granularity

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env));
  },
  // Manual trigger for testing: GET /?run=1
  async fetch(req, env) {
    if (new URL(req.url).searchParams.get('run') === '1') {
      const n = await run(env);
      return new Response(`ran; ${n} pings sent`);
    }
    return new Response('reminders worker ok');
  },
};

async function run(env) {
  const db = env.DB;
  const now = new Date();
  let pings = 0;

  const { results: users } = await db
    .prepare(
      `SELECT user_id, morning_digest, morning_time, task_nudge, lead_minutes, timezone
       FROM notification_prefs
       WHERE enabled = 1
         AND EXISTS (SELECT 1 FROM push_subscriptions s WHERE s.user_id = notification_prefs.user_id)`
    )
    .all();

  for (const u of users || []) {
    try {
      pings += await processUser(db, env, now, u);
    } catch (e) {
      console.log('user error', u.user_id, String(e));
    }
  }

  // prune old delivered rows
  await db
    .prepare(
      `DELETE FROM pending_notifications WHERE delivered = 1 AND created_at < datetime('now','-2 days')`
    )
    .run();

  return pings;
}

function localParts(tz, date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    weekday: p.weekday,
    minutes: parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10),
  };
}

function planWeekFor(localDate, weekday) {
  const idx = DAYS.indexOf(weekday);
  const d = new Date(localDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - (idx < 0 ? 0 : idx));
  const monday = d.getTime();
  const anchor = Date.parse(PLAN_ANCHOR_MONDAY + 'T00:00:00Z');
  const diff = Math.floor((monday - anchor) / (7 * 86400000)) + 1;
  return Math.min(PLAN_WEEKS, Math.max(1, diff));
}

function startMinutes(timeBlock) {
  const m = String(timeBlock).match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}

function inWindow(nowMin, targetMin) {
  return targetMin !== null && nowMin >= targetMin && nowMin < targetMin + WINDOW_MIN;
}

async function processUser(db, env, now, u) {
  const { date, weekday, minutes } = localParts(u.timezone || 'UTC', now);
  const pw = planWeekFor(date, weekday);

  const { results: tasks } = await db
    .prepare(
      `SELECT id, time_block, label, category FROM weekly_templates
       WHERE user_id = ? AND plan_week = ? AND day_of_week = ?
       ORDER BY sort_order ASC`
    )
    .bind(u.user_id, pw, weekday)
    .all();
  const todays = tasks || [];

  let queued = false;

  // Morning digest
  if (u.morning_digest) {
    const mm = startMinutes(u.morning_time || '07:00');
    if (inWindow(minutes, mm) && todays.length) {
      const first = todays[0];
      const body = `${todays.length} task${todays.length === 1 ? '' : 's'} today. First: ${first.time_block} ${first.label}`;
      queued =
        (await enqueue(db, u.user_id, `${DAY_NAMES[weekday] || 'Today'} plan`, body, '/dashboard', 'digest', `digest:${u.user_id}:${date}`)) || queued;
    }
  }

  // Per-task nudges
  if (u.task_nudge) {
    const lead = Number(u.lead_minutes) || 10;
    for (const t of todays) {
      const s = startMinutes(t.time_block);
      if (s === null) continue;
      if (inWindow(minutes, s - lead)) {
        queued =
          (await enqueue(db, u.user_id, 'Starting soon', `${t.time_block} — ${t.label}`, '/dashboard', 'nudge', `task:${t.id}:${date}`)) || queued;
      }
    }
  }

  if (!queued) return 0;
  return await pingUser(db, env, u.user_id);
}

async function enqueue(db, userId, title, body, url, tag, dedupKey) {
  const r = await db
    .prepare(
      `INSERT OR IGNORE INTO pending_notifications (id, user_id, title, body, url, tag, dedup_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), userId, title, body, url, tag, dedupKey)
    .run();
  return (r.meta?.changes || 0) > 0;
}

async function pingUser(db, env, userId) {
  const { results: subs } = await db
    .prepare('SELECT endpoint FROM push_subscriptions WHERE user_id = ?')
    .bind(userId)
    .all();
  let sent = 0;
  for (const s of subs || []) {
    try {
      const auth = await vapidAuth(env, s.endpoint);
      const res = await fetch(s.endpoint, {
        method: 'POST',
        headers: { Authorization: auth, TTL: '900' },
      });
      if (res.status === 404 || res.status === 410) {
        await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(s.endpoint).run();
      } else if (res.ok || res.status === 201) {
        sent++;
      }
    } catch (e) {
      console.log('ping error', String(e));
    }
  }
  return sent;
}

async function vapidAuth(env, endpoint) {
  const aud = new URL(endpoint).origin;
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const key = await importJWK(jwk, 'ES256');
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .setAudience(aud)
    .setSubject(env.VAPID_SUBJECT || 'mailto:admin@example.com')
    .setExpirationTime('12h')
    .sign(key);
  return `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`;
}
