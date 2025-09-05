// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function must(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

const firebaseConfig = {
  apiKey: must('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: must('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: must('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    must('NEXT_PUBLIC_FIREBASE_SENDER_ID (or *_MESSAGING_SENDER_ID)', process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID),
  appId: must('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

if (typeof window !== 'undefined' && !(window as any).__FIREBASE_CFG_LOGGED__) {
  (window as any).__FIREBASE_CFG_LOGGED__ = true;
  // Safe to log: these values are public by design
  // Remove this after confirming on Netlify
  // eslint-disable-next-line no-console
  console.log('[firebase] cfg', {
    apiKey: firebaseConfig.apiKey?.slice(0, 6) + '…',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId?.slice(0, 6) + '…',
  });
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
