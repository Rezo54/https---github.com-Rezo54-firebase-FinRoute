
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

function initializeFirebaseAdmin() {
    // Check if the required environment variables are set
    const hasCredentials =
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (admin.apps.length === 0 && hasCredentials) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // Replace escaped newlines before parsing
                    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                })
            });
            adminDb = admin.firestore();
            adminAuth = admin.auth();
        } catch (error: any) {
            console.error('Firebase admin initialization error', error.stack);
        }
    }
}

// Initialize on first import
initializeFirebaseAdmin();

function getAdminDb() {
    if (!adminDb) {
        initializeFirebaseAdmin();
        if (!adminDb) throw new Error("Firebase Admin DB not initialized. Missing credentials?");
    }
    return adminDb;
}

function getAdminAuth() {
    if (!adminAuth) {
        initializeFirebaseAdmin();
        if (!adminAuth) throw new Error("Firebase Admin Auth not initialized. Missing credentials?");
    }
    return adminAuth;
}

export { getAdminDb, getAdminAuth };
