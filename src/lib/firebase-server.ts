import 'server-only';
import * as admin from 'firebase-admin';

function normalizePrivateKey(k: string) {
  return k.replace(/^['"`]|['"`]$/g, '')
          .replace(/\\r/g, '')
          .replace(/\\n/g, '\n')
          .replace(/\r/g, '');
}

function loadServiceAccount() {
  // Preferred: raw JSON
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    const sa = JSON.parse(raw);
    sa.private_key = normalizePrivateKey(sa.private_key);
    return sa;
  }

  // Or base64 JSON
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();
  if (b64) {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const sa = JSON.parse(json);
    sa.private_key = normalizePrivateKey(sa.private_key);
    return sa;
  }

  // Fallback: 3 separate vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    : undefined;

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey } as any;
  }

  return null;
}

export function initializeFirebaseAdmin() {
  if (admin.apps.length) return;
  const sa = loadServiceAccount();
  if (!sa) {
    console.error('[Admin init] missing envs (provide FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64, or 3 vars)');
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64');
  }
  try {
    admin.initializeApp({ credential: admin.credential.cert(sa as admin.ServiceAccount) });
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    const dup = String(err?.code ?? '') === 'app/duplicate-app' || msg.includes('already exists');
    console.error('[Admin init failed]', { code: err?.code, msg });
    if (!dup) throw err;
  }
}

export function getAdminDb()   { initializeFirebaseAdmin(); return admin.firestore(); }
export function getAdminAuth() { initializeFirebaseAdmin(); return admin.auth(); }