export type Category = 'work' | 'fyp' | 'learn' | 'job' | 'rest';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  time_block: string;
  label: string;
  category: Category;
  sort_order: number;
  plan_week: number; // 1..4 — which week of the monthly plan this task belongs to
}

/** A template joined with its completion state for a given week. */
export interface TaskWithCompletion extends Template {
  done: boolean;
}
