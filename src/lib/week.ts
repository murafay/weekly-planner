/**
 * Returns the ISO date string ('YYYY-MM-DD') of the most recent Monday
 * relative to `from` (defaults to now), treating weeks as Mon–Sun.
 * Computed in UTC so the value is stable regardless of server timezone.
 */
export function getWeekStart(from: Date = new Date()): string {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  );
  // getUTCDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
}

/** Validates a 'YYYY-MM-DD' string; returns it normalized or null. */
export function normalizeWeekStart(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const dt = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(dt.getTime())) return null;
  return value;
}

/** Human-friendly label for a week, e.g. "Aug 25 – 31, 2026". */
export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00Z');
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', opts);
  return `${startStr} – ${endStr}, ${end.getUTCFullYear()}`;
}
