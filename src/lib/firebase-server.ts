
import 'server-only';
import * as admin from 'firebase-admin';

function normalizePrivateKey(raw?: string) {
  if (!raw) return undefined;
  let k = raw.trim();

  // strip one layer of wrapping quotes/backticks if present
  k = k.replace(/^['"`]|['"`]$/g, '');

  // turn escaped CR/LF into real newlines, remove stray CRs
  k = k.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');

  // if there is no PEM header, try base64-decode
  if (!k.includes('BEGIN') && /^[A-Za-z0-9+/=\s]+$/.test(k)) {
    try { k = Buffer.from(k.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch {}
  }

  // extract a clean PEM block if other text snuck in
  const m = k.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----/);
  if (m) k = m[0];

  return k;
}

export function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId  = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Admin init] Missing envs', { hasProjectId: !!projectId, hasClientEmail: !!clientEmail, hasPrivateKey: !!privateKey });
    throw new Error('Missing FIREBASE_* env vars');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } catch (err: any) {
    const code = String(err?.code ?? '');
    const msg  = String(err?.message ?? '');
    const dup  = code === 'app/duplicate-app' || msg.includes('already exists');
    console.error('[Admin init failed]', { code, msg, name: err?.name });
    if (!dup) throw err; // in dev, surface the original parse error so you can fix the key
  }
}

export const getAdminDb   = () => (initializeFirebaseAdmin(), admin.firestore());
export const getAdminAuth = () => (initializeFirebaseAdmin(), admin.auth());
