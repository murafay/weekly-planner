import { getDB } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
} from '@/lib/auth';
import { json, error, isValidEmail } from '@/lib/http';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!isValidEmail(email) || !password)
    return error('Invalid email or password', 401);

  const db = getDB();
  const user = await db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; password_hash: string }>();

  // Always run a verification to reduce timing-based user enumeration.
  const ok =
    user != null && (await verifyPassword(password, user.password_hash));
  if (!ok || !user) return error('Invalid email or password', 401);

  const token = await createSessionToken({ sub: user.id, email: user.email });
  await setSessionCookie(token);

  return json({ user: { id: user.id, email: user.email } });
}
