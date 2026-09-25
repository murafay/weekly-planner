import { getDB } from '@/lib/db';
import { hashPassword, sha256hex } from '@/lib/auth';
import { json, error } from '@/lib/http';

export const runtime = 'edge';

// POST /api/auth/reset  body: { token, password }
// Validates a non-expired, unused reset token and sets the new password.
export async function POST(req: Request): Promise<Response> {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!token) return error('Missing reset token');
  if (password.length < 8)
    return error('Password must be at least 8 characters');

  const db = getDB();
  const tokenHash = await sha256hex(token);
  const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const row = await db
    .prepare(
      `SELECT id, user_id FROM password_resets
       WHERE token_hash = ? AND used = 0 AND expires_at > ?`
    )
    .bind(tokenHash, nowIso)
    .first<{ id: string; user_id: string }>();

  if (!row) {
    return error('This reset link is invalid or has expired.', 400);
  }

  const newHash = await hashPassword(password);
  await db.batch([
    db
      .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(newHash, row.user_id),
    db
      .prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
      .bind(row.id),
  ]);

  return json({ ok: true });
}
