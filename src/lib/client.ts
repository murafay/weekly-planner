'use client';

import type { Template, TaskWithCompletion } from './types';

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // auth
  signup: (email: string, password: string) =>
    req<{ user: { id: string; email: string } }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    req<{ user: { id: string; email: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => req<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => req<{ user: { id: string; email: string } }>('/api/auth/me'),

  // dashboard data (current plan week joined with completion state)
  week: (week?: string) =>
    req<{
      week_start_date: string;
      plan_week: number;
      plan_theme: string;
      plan_color: string;
      tasks: TaskWithCompletion[];
    }>(`/api/completions${week ? `?week=${week}` : ''}`),

  // full 4-week plan with completion state per week (Calendar view)
  month: () =>
    req<{
      current_plan_week: number;
      weeks: {
        plan_week: number;
        week_start_date: string;
        theme: string;
        tools: string;
        color: string;
        is_current: boolean;
        tasks: TaskWithCompletion[];
      }[];
    }>('/api/month'),
  setDone: (template_id: string, done: boolean, week_start_date?: string) =>
    req<{ ok: true }>('/api/completions', {
      method: 'POST',
      body: JSON.stringify({ template_id, done, week_start_date }),
    }),

  // templates
  listTemplates: () =>
    req<{ templates: Template[] }>('/api/templates'),
  createTemplate: (t: Omit<Template, 'id' | 'user_id' | 'sort_order'>) =>
    req<{ template: Template }>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(t),
    }),
  updateTemplate: (
    id: string,
    t: Omit<Template, 'id' | 'user_id' | 'sort_order'>
  ) =>
    req<{ template: Template }>(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(t),
    }),
  deleteTemplate: (id: string) =>
    req<{ ok: true }>(`/api/templates/${id}`, { method: 'DELETE' }),
  reorder: (items: { id: string; sort_order: number }[]) =>
    req<{ ok: true }>('/api/templates/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};
