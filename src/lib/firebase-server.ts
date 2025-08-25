
import * as admin from 'firebase-admin';

let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;

function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        if (!adminAuth) {
            adminAuth = admin.auth();
        }
        if (!adminDb) {
            adminDb = admin.firestore();
        }
        return;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
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
        adminAuth = admin.auth();
        adminDb = admin.firestore();
    } catch (error) {
        console.error('Firebase Admin SDK initialization error:', error);
        throw new Error('Failed to initialize Firebase Admin SDK.');
    }
}

export function getAdminDb() {
    initializeFirebaseAdmin();
    return adminDb;
}

export function getAdminAuth() {
    initializeFirebaseAdmin();
    return adminAuth;
}
