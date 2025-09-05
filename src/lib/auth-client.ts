// src/lib/auth-client.ts
import { GoogleAuthProvider, signInWithPopup, signOut, type UserCredential } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();

export async function googleLogin(): Promise<UserCredential> {
  return await signInWithPopup(auth, provider);
}

export async function logoutClient() {
  return await signOut(auth);
}
