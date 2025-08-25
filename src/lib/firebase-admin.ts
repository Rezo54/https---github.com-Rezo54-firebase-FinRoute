
import * as admin from 'firebase-admin';

// Ensure the private key is formatted correctly.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Check for existing app initialization.
if (!admin.apps.length) {
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
            console.error('Firebase admin initialization error:', error.stack);
            throw new Error("Server configuration error: Failed to initialize Firebase Admin SDK.");
        }
    } else {
        // This will be logged on the server console if credentials are not in .env
        console.warn("Firebase Admin SDK credentials not fully provided in environment variables. Server-side Firebase functionality will be limited.");
    }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb as getAdminDb, adminAuth as getAdminAuth };
