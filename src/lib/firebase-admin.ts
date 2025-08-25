
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (!admin.apps.length) {
    const hasCredentials =
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY;

    if (hasCredentials) {
        try {
            adminApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                })
            });
        } catch (error: any) {
            console.error('Firebase admin initialization error', error.stack);
            throw new Error("Server configuration error: Failed to initialize Firebase Admin SDK.");
        }
    } else {
        // This will throw an error if called in an environment without credentials,
        // which is the expected behavior for server actions that need it.
        try {
            adminApp = admin.initializeApp();
        } catch (e) {
            console.error("Firebase Admin SDK initialization failed. Credentials may be missing.");
            // We don't throw here to allow client-side to still try to render.
            // The functions below will throw if the SDK is needed but not available.
        }
    }
} else {
    adminApp = admin.app();
}


export function getAdminDb() {
    if (!adminApp) {
        throw new Error("Firebase Admin App not initialized. Missing credentials?");
    }
    return adminApp.firestore();
}

export function getAdminAuth() {
    if (!adminApp) {
        throw new Error("Firebase Admin App not initialized. Missing credentials?");
    }
    return adminApp.auth();
}
