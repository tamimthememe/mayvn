import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAmAbFRXXkkF1JNNZ3BK7htBBUrEZPIHwg",
  authDomain: "mayvn-95e4f.firebaseapp.com",
  projectId: "mayvn-95e4f",
  storageBucket: "mayvn-95e4f.firebasestorage.app",
  messagingSenderId: "1018108237638",
  appId: "1:1018108237638:web:e4203aefb96a1bec2eb747",
  measurementId: "G-BN6TQ2PG5L"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

