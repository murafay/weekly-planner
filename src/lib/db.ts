import { getRequestContext } from '@cloudflare/next-on-pages';

/** Returns the D1 database bound as `DB` in wrangler.toml. */
export function getDB(): D1Database {
  const { env } = getRequestContext();
  if (!env.DB) {
    throw new Error(
      'D1 binding `DB` is missing. Check wrangler.toml and that migrations have been applied.'
    );
  }
  return env.DB;
}

/** Returns the JWT signing secret from the environment. */
export function getJwtSecret(): string {
  const { env } = getRequestContext();
  if (!env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not set. Add it to .dev.vars (local) or as a Pages secret (production).'
    );
  }
  return env.JWT_SECRET;
}
