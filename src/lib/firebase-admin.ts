
// firebaseAdmin.ts
import * as admin from "firebase-admin";

let initialized = false;

function getPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  
  // First, try to handle JSON-encoded keys (common in some environments)
  try {
    // If the key is wrapped in quotes, it might be a JSON string.
    if (raw.startsWith('"') && raw.endsWith('"')) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // Not a valid JSON string, proceed with direct replacement.
  }

  // Fallback for Vercel/similar environments that escape newlines
  return raw.replace(/\\n/g, '\n');
}


function ensureInitialized() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file."
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
