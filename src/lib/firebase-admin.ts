
import * as admin from 'firebase-admin';

// Ensure the private key is formatted correctly.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

function initializeAdmin() {
    // Check if essential environment variables are present.
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                })
            });
        } catch (error: any) {
            // This error will be caught by the calling function.
            // We check for the 'already-exists' code to avoid crashing on hot reloads.
            if (error.code !== 'auth/already-exists') {
                 console.error('Firebase admin initialization error:', error.stack);
                 throw new Error("Server configuration error: Failed to initialize Firebase Admin SDK.");
            }
        }
    } else {
        // This will be logged on the server console if credentials are not in .env
        console.warn("Firebase Admin SDK credentials not fully provided in environment variables. Server-side Firebase functionality will be limited.");
    }
}

// Initialize the app if it hasn't been already.
if (!admin.apps.length) {
    initializeAdmin();
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb as getAdminDb, adminAuth as getAdminAuth };
