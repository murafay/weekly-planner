'use client';

import { useEffect, useState } from 'react';

interface Prefs {
  enabled: boolean;
  morning_digest: boolean;
  morning_time: string;
  task_nudge: boolean;
  lead_minutes: number;
  timezone: string;
}

const DEFAULT_PREFS: Prefs = {
  enabled: true,
  morning_digest: true,
  morning_time: '07:00',
  task_nudge: true,
  lead_minutes: 10,
  timezone: 'Asia/Karachi',
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function NotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});

    fetch('/api/notifications/prefs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (!d?.prefs) return;
        const p = d.prefs;
        setPrefs({
          enabled: !!p.enabled,
          morning_digest: !!p.morning_digest,
          morning_time: p.morning_time || '07:00',
          task_nudge: !!p.task_nudge,
          lead_minutes: Number(p.lead_minutes) || 10,
          timezone: p.timezone || DEFAULT_PREFS.timezone,
        });
      })
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setMsg('Notifications were blocked. Enable them in your browser settings.');
        return;
      }
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw.js'));
      await navigator.serviceWorker.ready;

      const keyRes = await fetch('/api/push/vapid-key');
      if (!keyRes.ok) throw new Error('Push is not configured on the server.');
      const { key } = (await keyRes.json()) as { key: string };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });

      const tz =
        Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_PREFS.timezone;
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), timezone: tz }),
      });
      if (!res.ok) throw new Error('Could not save subscription.');

      setSubscribed(true);
      setPrefs((p) => ({ ...p, timezone: tz, enabled: true }));
      setMsg('Reminders on. You’ll get a morning digest and nudges before tasks.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg('Reminders turned off on this device.');
    } catch (e) {
      setMsg('Could not turn off reminders.');
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs(next: Prefs) {
    setPrefs(next);
    try {
      await fetch('/api/notifications/prefs', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch {
      /* ignore */
    }
  }

  if (!supported) {
    return (
      <div className="card notif-card">
        <h2>Reminders</h2>
        <p className="muted">
          This browser doesn&apos;t support push notifications. Install the app
          (or use Chrome/Edge) to get reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="card notif-card">
      <div className="notif-head">
        <div>
          <h2>Reminders</h2>
          <p className="muted">
            Get a push notification even when the app is closed.
          </p>
        </div>
        {subscribed ? (
          <button className="btn btn-sm" onClick={disable} disabled={busy}>
            Turn off on this device
          </button>
        ) : (
          <button className="btn btn-primary" onClick={enable} disabled={busy}>
            {busy ? 'Enabling…' : 'Enable reminders'}
          </button>
        )}
      </div>

      {msg && <div className="notif-msg">{msg}</div>}

      <div className={`notif-prefs${subscribed ? '' : ' dim'}`}>
        <label className="notif-row">
          <input
            type="checkbox"
            checked={prefs.morning_digest}
            onChange={(e) => savePrefs({ ...prefs, morning_digest: e.target.checked })}
          />
          <span className="grow">Morning digest of today&apos;s tasks</span>
          <input
            type="time"
            value={prefs.morning_time}
            onChange={(e) => savePrefs({ ...prefs, morning_time: e.target.value })}
            className="notif-time"
            aria-label="Morning digest time"
          />
        </label>

        <label className="notif-row">
          <input
            type="checkbox"
            checked={prefs.task_nudge}
            onChange={(e) => savePrefs({ ...prefs, task_nudge: e.target.checked })}
          />
          <span className="grow">Nudge before each task</span>
          <span className="notif-lead">
            <input
              type="number"
              min={0}
              max={120}
              value={prefs.lead_minutes}
              onChange={(e) =>
                savePrefs({ ...prefs, lead_minutes: Number(e.target.value) })
              }
              className="notif-num"
              aria-label="Minutes before task"
            />
            min before
          </span>
        </label>

        <div className="notif-tz muted">Timezone: {prefs.timezone}</div>
      </div>
    </div>
  );
}
