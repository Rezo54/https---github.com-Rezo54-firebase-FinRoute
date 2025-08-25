import 'server-only';
import * as admin from 'firebase-admin';

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  const unquoted = raw.replace(/^['"]|['"]$/g, '');
  return unquoted.replace(/\\n/g, '\n');
}

export function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId  = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Admin init] Missing envs', {
      hasProjectId: !!projectId, hasClientEmail: !!clientEmail, hasPrivateKey: !!privateKey
    });
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

    console.error('[Admin init failed]', { code, msg, name: err?.name, stack: err?.stack });

    if (!dup) {
      if (process.env.NODE_ENV !== 'production') throw err;
      throw new Error('Failed to initialize Firebase Admin SDK.');
    }
  }
}

export function getAdminDb() { initializeFirebaseAdmin(); return admin.firestore(); }
export function getAdminAuth() { initializeFirebaseAdmin(); return admin.auth(); }
