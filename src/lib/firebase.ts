// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "finroute-49u64",
  appId: "1:435728537189:web:8b6f491d095458e2ccd88c",
  storageBucket: "finroute-49u64.firebasestorage.app",
  apiKey: "AIzaSyCsuS0nDiCqPPFoQkTRU7Cs3BSDHfvTOTY",
  authDomain: "finroute-49u64.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "435728537189",
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
