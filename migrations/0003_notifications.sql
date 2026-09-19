-- Web Push notifications: device subscriptions, per-user reminder prefs,
-- and a small delivery queue the scheduled worker fills and the app drains.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions (user_id);

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id        TEXT PRIMARY KEY,
  enabled        INTEGER NOT NULL DEFAULT 1,
  morning_digest INTEGER NOT NULL DEFAULT 1,
  morning_time   TEXT NOT NULL DEFAULT '07:00',  -- local HH:MM
  task_nudge     INTEGER NOT NULL DEFAULT 1,
  lead_minutes   INTEGER NOT NULL DEFAULT 10,
  timezone       TEXT NOT NULL DEFAULT 'Asia/Karachi',
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Queue: the scheduled worker inserts due reminders (dedup_key keeps each
-- occurrence unique), then pings the device; the SW fetches undelivered rows
-- and marks them delivered.
CREATE TABLE IF NOT EXISTS pending_notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  url        TEXT NOT NULL DEFAULT '/dashboard',
  tag        TEXT NOT NULL DEFAULT 'planner',
  dedup_key  TEXT NOT NULL UNIQUE,
  delivered  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pending_user ON pending_notifications (user_id, delivered);
