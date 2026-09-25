import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDB } from '@/lib/db';
import { generateToken, sha256hex } from '@/lib/auth';
import { json, error, isValidEmail } from '@/lib/http';

export const runtime = 'edge';

const RESET_TTL_MIN = 60; // link valid for 1 hour

// POST /api/auth/forgot  body: { email }
// Always responds the same way (no account enumeration). If the email maps to a
// user, it stores a hashed reset token and emails a link via Resend.
export async function POST(req: Request): Promise<Response> {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return error('Invalid request body');
  }
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) return error('Please enter a valid email address');

  const db = getDB();
  const user = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string }>();

  if (user) {
    const token = generateToken();
    const tokenHash = await sha256hex(token);
    const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60_000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    // Invalidate previous unused tokens for this user, then store the new one.
    await db
      .prepare('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0')
      .bind(user.id)
      .run();
    await db
      .prepare(
        `INSERT INTO password_resets (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), user.id, tokenHash, expiresAt)
      .run();

    const origin = new URL(req.url).origin;
    const link = `${origin}/reset?token=${token}`;
    await sendResetEmail(email, link).catch(() => {
      /* don't leak send failures to the client */
    });
  }

  return json({
    ok: true,
    message: 'If that email has an account, a reset link is on its way.',
  });
}

async function sendResetEmail(to: string, link: string): Promise<void> {
  const { env } = getRequestContext();
  const key = env.RESEND_API_KEY;
  if (!key) {
    console.log('RESEND_API_KEY not set — reset link:', link);
    return;
  }
  const from = env.RESEND_FROM || 'Weekly Planner <onboarding@resend.dev>';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2>Reset your password</h2>
      <p>We received a request to reset your Weekly Planner password.
      Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#4f6bed;color:#fff;padding:12px 20px;
        border-radius:10px;text-decoration:none;display:inline-block">Reset password</a>
      </p>
      <p style="color:#6b7280;font-size:13px">If you didn't request this, you can
      safely ignore this email. Or paste this link into your browser:<br>${link}</p>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Reset your Weekly Planner password',
      html,
    }),
  });
  if (!res.ok) {
    console.log('Resend error', res.status, await res.text().catch(() => ''));
  }
}
