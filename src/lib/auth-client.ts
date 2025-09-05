// src/lib/auth-client.ts
'use client';

import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

export async function emailLogin(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function emailSignup(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

const provider = new GoogleAuthProvider();
export async function googlePopup() {
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}
