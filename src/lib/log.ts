'use client';

type Level = 'info' | 'warn' | 'error' | 'debug';

function maskEmail(email?: string | null) {
  if (!email) return undefined;
  return email.replace(/(^.).*(@.*$)/, '$1***$2');
}

export function log(event: string, data?: Record<string, any>, level: Level = 'info') {
  const payload = {
    event,
    level,
    ts: new Date().toISOString(),
    ...sanitize(data),
  };

  // Always log to console for instant feedback
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log']('[app]', payload);

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/log', blob);
    } else {
      void fetch('/api/log', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    }
  } catch {
    // best effort; don’t throw
  }
}

export function logError(event: string, err: any, extra?: Record<string, any>) {
  const data = {
    name: err?.name,
    code: err?.code,
    message: err?.message,
    stack: err?.stack,
    ...extra,
  };
  log(event, data, 'error');
}

function sanitize(obj?: Record<string, any>) {
  if (!obj) return {};
  const copy: Record<string, any> = { ...obj };
  // Never log raw passwords or tokens if they sneak in
  delete copy.password;
  delete copy.idToken;
  if (copy.email) copy.emailMasked = maskEmail(String(copy.email));
  delete copy.email;
  return copy;
}
