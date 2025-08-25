// src/lib/firebase-server.ts
import * as admin from 'firebase-admin';

// This guard prevents re-initialization in development environments.
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    // We are throwing a clear error here to make sure developers know what's missing.
    // This is better than letting the app crash with a cryptic error later.
    throw new Error(
      'Firebase Admin credentials are not set in the environment variables. ' +
      'Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
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
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Re-throwing the error is important to halt execution if initialization fails.
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

// Export the initialized services.
// By calling admin.firestore() and admin.auth() here, we are sure they are called
// only after initializeApp() has been successfully run.
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
