import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxWZ6itMyZrPdeN9h4xAf4q_hxkXmiQjc",
  authDomain: "stitchmanager-ebdd7.firebaseapp.com",
  projectId: "stitchmanager-ebdd7",
  storageBucket: "stitchmanager-ebdd7.firebasestorage.app",
  messagingSenderId: "342548241566",
  appId: "1:342548241566:web:ea84866c25f56ae06d2f8f",
  measurementId: "G-CVN4KLY6BL"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
