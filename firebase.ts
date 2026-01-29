// Fix: Use wildcard imports and destructuring for Firebase to bypass named export resolution issues in the environment.
import { initializeApp, getApps } from "firebase/app";
import * as firestoreModule from "firebase/firestore";
import * as authModule from "firebase/auth";

const { getFirestore } = firestoreModule as any;
const { getAuth } = authModule as any;

const firebaseConfig = {
  apiKey: "AIzaSyAKRXkylQirWHZUNZdSLibw6zPfaVJ9p4o",
  authDomain: "airsoftapp-43d31.firebaseapp.com",
  projectId: "airsoftapp-43d31",
  storageBucket: "airsoftapp-43d31.firebasestorage.app",
  messagingSenderId: "1090497616042",
  appId: "1:1090497616042:web:383460288d04bbbfd7d8d3",
  measurementId: "G-1Z1K1R91E5"
};

// Initialize Firebase modularly
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);