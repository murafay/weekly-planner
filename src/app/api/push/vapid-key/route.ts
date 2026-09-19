import { getRequestContext } from '@cloudflare/next-on-pages';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

// GET /api/push/vapid-key — public VAPID key the browser needs to subscribe.
export async function GET(): Promise<Response> {
  const key = getRequestContext().env.VAPID_PUBLIC_KEY;
  if (!key) return error('Push not configured', 503);
  return json({ key });
}
