import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyALfG3HZx2OGohbdsBRYiji1UiYe2Huq0Q",
  authDomain: "mayvn-2d683.firebaseapp.com",
  projectId: "mayvn-2d683",
  storageBucket: "mayvn-2d683.firebasestorage.app",
  messagingSenderId: "381254722867",
  appId: "1:381254722867:web:46a0fde128b35ca5654a46",
  measurementId: "G-51JWG8GQ5W"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };

