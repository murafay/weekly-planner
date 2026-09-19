// Enable the Cloudflare dev platform so `next dev` can access the D1 binding
// (and any secrets from .dev.vars) locally through Miniflare.
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

export default nextConfig;
