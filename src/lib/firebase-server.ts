
import 'server-only';
import * as admin from 'firebase-admin';

function normalizePrivateKey(k: string) {
  // turn \r\n/\n escapes into real newlines and strip wrapping quotes
  return k.replace(/^['"`]|['"`]$/g, '').replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');
}

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

  if (!raw && !b64) return null;
  const json = raw ?? Buffer.from(String(b64), 'base64').toString('utf8');
  const sa = JSON.parse(json);
  sa.private_key = normalizePrivateKey(sa.private_key);
  return sa;
}

export function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const sa = loadServiceAccount();
  if (!sa) {
    console.error('[Admin init] Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64 env var.');
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64');
  }

  try {
    admin.initializeApp({ credential: admin.credential.cert(sa as admin.ServiceAccount) });
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    const dup = String(err?.code ?? '') === 'app/duplicate-app' || msg.includes('already exists');
    console.error('[Admin init failed]', { code: err?.code, msg });
    if (!dup) throw err; // surface real parse error in dev
  }
}

export const getAdminDb = () => (initializeFirebaseAdmin(), admin.firestore());
export const getAdminAuth = () => (initializeFirebaseAdmin(), admin.auth());
