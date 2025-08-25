// firebaseAdmin.ts
import * as admin from "firebase-admin";

let initialized = false;

function getPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  // Fix escaped newlines (Vercel/Env)
  const fixed = raw.replace(/\\n/g, "\n");
  // Some env tools wrap the key in extra quotes — strip only if both ends are quotes
  return fixed.startsWith('"') && fixed.endsWith('"') ? fixed.slice(1, -1) : fixed;
}

function ensureInitialized() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  // If you’re running on GCP (Cloud Run/Functions), you could prefer:
  // admin.initializeApp({ credential: admin.credential.applicationDefault() })
  // Docs: https://cloud.google.com/docs/authentication/provide-credentials-adc
  if (!projectId || !clientEmail || !privateKey) {
    // Decide: either throw (strict) or log+defer (lenient). Throw is usually better server-side.
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    initialized = true;
  } catch (error: any) {
    const msg = String(error?.message ?? "");
    const code = String(error?.code ?? "");
    const isDuplicate = code === "app/duplicate-app" || msg.includes("already exists");
    if (!isDuplicate) {
      // Log the real cause so you can fix it (parse errors, bad key format, etc.)
      console.error("Firebase Admin init failed:", error);
      throw new Error("Server configuration error: Failed to initialize Firebase Admin SDK.");
    }
    initialized = true; // App already exists
  }
}

export function getAdminDb() {
  ensureInitialized();
  return admin.firestore();
}

export function getAdminAuth() {
  ensureInitialized();
  return admin.auth();
}
