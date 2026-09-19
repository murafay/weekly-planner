import { getDB } from '@/lib/db';
import {
  hashPassword,
  createSessionToken,
  setSessionCookie,
} from '@/lib/auth';
import { seedTemplatesForUser } from '@/lib/seed';
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

  if (!isValidEmail(email)) return error('Please enter a valid email address');
  if (password.length < 8)
    return error('Password must be at least 8 characters');

  const db = getDB();

  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string }>();
  if (existing) return error('An account with that email already exists', 409);

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);

  await db
    .prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
    .bind(id, email, password_hash)
    .run();

  // Give the new account a realistic starter week.
  await seedTemplatesForUser(db, id);

  const token = await createSessionToken({ sub: id, email });
  await setSessionCookie(token);

  return json({ user: { id, email } }, 201);
}
