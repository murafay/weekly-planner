import { getWeekStart } from './week';

/**
 * The monthly plan is a fixed sequence of 4 weeks anchored to a start Monday.
 * The app maps the current real week to a plan week (1..4) so the dashboard
 * always shows "the right week" automatically.
 */
export const PLAN_WEEKS = 4;
export const PLAN_ANCHOR_MONDAY = '2026-08-31'; // Week 1 begins here

const DAY_MS = 86_400_000;

/** Which plan week (1..4) a given week-start Monday falls in, clamped to range. */
export function getPlanWeek(weekStart: string = getWeekStart()): number {
  const anchor = Date.parse(PLAN_ANCHOR_MONDAY + 'T00:00:00Z');
  const cur = Date.parse(weekStart + 'T00:00:00Z');
  if (Number.isNaN(anchor) || Number.isNaN(cur)) return 1;
  const diffWeeks = Math.floor((cur - anchor) / (7 * DAY_MS));
  return Math.min(PLAN_WEEKS, Math.max(1, diffWeeks + 1));
}

/** The Monday (YYYY-MM-DD) on which a given plan week (1..4) starts. */
export function weekStartForPlanWeek(planWeek: number): string {
  const n = Math.min(PLAN_WEEKS, Math.max(1, Math.trunc(planWeek)));
  const d = new Date(PLAN_ANCHOR_MONDAY + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + (n - 1) * 7);
  return d.toISOString().slice(0, 10);
}

/** Validates/normalizes a plan_week value to 1..4, defaulting to `fallback`. */
export function normalizePlanWeek(value: unknown, fallback = 1): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n < 1 || n > PLAN_WEEKS) return fallback;
  return n;
}

export interface PlanWeekMeta {
  week: number;
  theme: string;
  tools: string;
  color: string; // used as the accent for this week in the UI
}

export const PLAN_WEEK_META: Record<number, PlanWeekMeta> = {
  1: { week: 1, theme: 'GitOps · ArgoCD', tools: 'ArgoCD, Argo Workflows', color: '#4f6bed' },
  2: { week: 2, theme: 'Secrets · Vault + ESO', tools: 'Vault, External Secrets', color: '#e08a00' },
  3: { week: 3, theme: 'Ingress & TLS', tools: 'NGINX, Cert-Manager, Kustomize', color: '#0d9f6e' },
  4: { week: 4, theme: 'Observability + Capstone', tools: 'Loki, OpenTelemetry', color: '#8b5cf6' },
};

export function planWeekMeta(week: number): PlanWeekMeta {
  return PLAN_WEEK_META[week] ?? PLAN_WEEK_META[1];
}
