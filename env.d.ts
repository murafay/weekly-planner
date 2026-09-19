// Cloudflare bindings available at runtime via getRequestContext().env
interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
  VAPID_PUBLIC_KEY: string;
}
