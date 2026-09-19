import { clearSessionCookie } from '@/lib/auth';
import { json } from '@/lib/http';

export const runtime = 'edge';

export async function POST(): Promise<Response> {
  await clearSessionCookie();
  return json({ ok: true });
}
