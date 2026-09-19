-- Weekly Planner — initial schema
-- Run locally:  npm run db:migrate:local
-- Run remote:   npm run db:migrate:remote

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weekly_templates (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  day_of_week TEXT NOT NULL,             -- 'Mon' | 'Tue' | ... | 'Sun'
  time_block  TEXT NOT NULL,             -- e.g. '09:00–18:00'
  label       TEXT NOT NULL,
  category    TEXT NOT NULL,             -- 'work' | 'fyp' | 'learn' | 'job' | 'rest'
  sort_order  INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_templates_user
  ON weekly_templates (user_id, day_of_week, sort_order);

CREATE TABLE IF NOT EXISTS completions (
  id              TEXT PRIMARY KEY,
  template_id     TEXT NOT NULL,
  week_start_date TEXT NOT NULL,         -- 'YYYY-MM-DD' (the Monday of the week)
  done            INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (template_id) REFERENCES weekly_templates(id) ON DELETE CASCADE,
  UNIQUE (template_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_completions_week
  ON completions (week_start_date);
