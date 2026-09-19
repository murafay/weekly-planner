-- Adds a 4-week "plan week" dimension so the planner can hold a full month
-- (Week 1–4), each with its own tasks, and auto-advance by real date.
-- Run locally:  npm run db:migrate:local
-- Run remote:   npm run db:migrate:remote

ALTER TABLE weekly_templates ADD COLUMN plan_week INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_templates_planweek
  ON weekly_templates (user_id, plan_week, day_of_week, sort_order);
