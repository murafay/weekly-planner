// Cloudflare bindings available at runtime via getRequestContext().env
interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
  VAPID_PUBLIC_KEY: string;
  // Email (Brevo) for password-reset messages.
  BREVO_API_KEY?: string;
  MAIL_FROM?: string; // verified sender address in Brevo
  MAIL_FROM_NAME?: string;
}
