
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsuS0nDiCqPPFoQkTRU7Cs3BSDHfvTOTY",
  authDomain: "finroute-49u64.firebaseapp.com",
  projectId: "finroute-49u64",
  storageBucket: "finroute-49u64.firebasestorage.app",
  messagingSenderId: "435728537189",
  appId: "1:435728537189:web:324058f04ce4fd37ccd88c",
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
