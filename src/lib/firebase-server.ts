// src/lib/firebase-server.ts
// No "use server" here. This is a server-only *utility* (not a Server Action module).
import 'server-only';
import * as admin from 'firebase-admin';

const ENABLE_ADMIN = process.env.ENABLE_ADMIN === 'true'; // <- gate

let app: admin.app.App | null = null;

/** Normalize PEM newlines/quotes if you ever decide to set the envs later */
function normalizePrivateKey(k: string) {
  return k
    .replace(/^['"`]|['"`]$/g, '')   // strip wrapping quotes
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '');
}

/** Load service account from one of the supported envs. Return null if not configured. */
function loadServiceAccount():
  | (admin.ServiceAccount & { private_key: string })
  | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64?.trim();

  if (raw) {
    const json = JSON.parse(raw);
    json.private_key = normalizePrivateKey(json.private_key);
    return json;
  }
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    json.private_key = normalizePrivateKey(json.private_key);
    return json;
  }

  // 3-var fallback if you ever set them
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    : undefined;

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, private_key: privateKey } as any;
  }

  return null; // => Admin is *not* configured (and that’s fine)
}

/** Initialize Admin only if envs exist. Otherwise remain a no-op. */
function ensureAdmin(): admin.app.App | null {
  if (!ENABLE_ADMIN) return null; // <- short-circuit: never init
  if (app) return app;
  if (admin.apps.length) return (app = admin.app());

  const sa = loadServiceAccount();
  if (!sa) {
    // If you enable admin, this error will fire.
    throw new Error(
      'Firebase Admin is not configured. Provide FIREBASE_SERVICE_ACCOUNT(_B64) or the 3 vars.'
    );
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
    return app;
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    const dup =
      String(err?.code ?? '') === 'app/duplicate-app' ||
      msg.includes('already exists');
    if (!dup) {
      // Surface the real cause in dev; avoid generic rethrows that hide parse errors
      if (process.env.NODE_ENV !== 'production') throw err;
      throw new Error('Failed to initialize Firebase Admin SDK.');
    }
    app = admin.app();
    return app;
  }
}

/** Public helpers — safe to import. They only work if Admin is configured. */
export function getAdminAuth() {
  const a = ensureAdmin();
  if (!a) throw new Error('Admin disabled (set ENABLE_ADMIN=true to enable).');
  return admin.auth();
}

export function getAdminDb() {
  const a = ensureAdmin();
  if (!a) throw new Error('Admin disabled (set ENABLE_ADMIN=true to enable).');
  return admin.firestore();
}

/** Optional: ask if Admin is available (feature flag) */
export const hasAdmin = !!(ENABLE_ADMIN && loadServiceAccount());
