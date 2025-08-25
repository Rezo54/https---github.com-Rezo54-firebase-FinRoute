
import * as admin from 'firebase-admin';

// Check if the required environment variables are set
const hasCredentials =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length && hasCredentials) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines before parsing
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            })
        });
    } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
    }
}


const adminDb = admin.apps.length ? admin.firestore() : undefined;
const adminAuth = admin.apps.length ? admin.auth() : undefined;

export { adminDb, adminAuth };
