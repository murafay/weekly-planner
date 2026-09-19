import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return error('Not authenticated', 401);
  return json({ user: { id: session.sub, email: session.email } });
}
