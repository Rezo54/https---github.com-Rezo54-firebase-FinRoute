// src/lib/firebase-server.ts
import * as admin from 'firebase-admin';

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  const unquoted = raw.replace(/^['"]|['"]$/g, '');          // strip wrapping quotes if any
  return unquoted.includes('\\n') ? unquoted.replace(/\\n/g, '\n') : unquoted; // fix escaped \n
}

export function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Admin init] Missing envs', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
    });
    throw new Error('Missing FIREBASE_* env vars');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } catch (err: any) {
    // >>> Log everything useful
    console.error('[Admin init failed]', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      stack: err?.stack,
      toString: err?.toString?.(),
    });
    // Handle harmless duplicate init during hot reload
    const dup = (err?.code === 'app/duplicate-app') || String(err?.message).includes('already exists');
    if (!dup) throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

export function getAdminDb() { initializeFirebaseAdmin(); return admin.firestore(); }
export function getAdminAuth() { initializeFirebaseAdmin(); return admin.auth(); }
