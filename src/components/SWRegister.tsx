'use client';

import { useEffect } from 'react';

// Registers the service worker so the app is installable and works offline.
// Skipped on localhost to avoid caching dev assets during development.
export default function SWRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore registration errors */
    });
  }, []);

  return null;
}
