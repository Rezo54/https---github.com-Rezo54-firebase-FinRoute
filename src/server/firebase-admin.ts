// src/server/firebase-admin.ts
import * as admin from 'firebase-admin';

// Avoid re-initializing in hot reload / multiple loads
const existing = admin.apps[0];

function getServiceAccount() {
  // Option A: single JSON blob in FIREBASE_SERVICE_ACCOUNT
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
  }
  // Option B: 3 separate vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Netlify stores multiline envs escaped -> fix \n
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Provide FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY.'
    );
  }

  return { projectId, clientEmail, privateKey };
}

export const adminApp =
  existing ||
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount() as admin.ServiceAccount),
    // databaseURL optional if you only use Firestore
  });

export const adminDb = admin.firestore(adminApp);
