import type { Category, DayOfWeek } from './types';

export const CATEGORIES: Category[] = ['work', 'fyp', 'learn', 'job', 'rest'];

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string }
> = {
  work: { label: 'Work', color: '#3b82f6' }, // blue
  fyp: { label: 'FYP', color: '#f97316' }, // coral / orange
  learn: { label: 'Learn', color: '#8b5cf6' }, // purple
  job: { label: 'Job', color: '#22c55e' }, // green
  rest: { label: 'Rest', color: '#9ca3af' }, // gray
};

export const DAYS: DayOfWeek[] = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && (CATEGORIES as string[]).includes(v);
}

export function isDay(v: unknown): v is DayOfWeek {
  return typeof v === 'string' && (DAYS as string[]).includes(v);
}
