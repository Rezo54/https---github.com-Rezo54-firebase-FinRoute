import * as admin from 'firebase-admin';

const existing = admin.apps[0];

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Admin creds: set FIREBASE_SERVICE_ACCOUNT OR the 3 vars.');
  }
  return { projectId, clientEmail, privateKey };
}

export const adminApp =
  existing || admin.initializeApp({ credential: admin.credential.cert(getServiceAccount() as admin.ServiceAccount) });

export const adminDb = admin.firestore(adminApp);
