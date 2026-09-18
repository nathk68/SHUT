import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in RN bundle but missing from TS types (Firebase v12 known issue)
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ====================================================================
// FIREBASE CONFIGURATION
// Replace the values below with your Firebase project credentials
// from https://console.firebase.google.com > Project Settings > General
// ====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBERbBRO7wL5l-7GjHGOYd10_98iwsql7A",
  authDomain: "shut-app-c0067.firebaseapp.com",
  projectId: "shut-app-c0067",
  storageBucket: "shut-app-c0067.firebasestorage.app",
  messagingSenderId: "995264496230",
  appId: "1:995264496230:web:f7d8bf8f153b4e4c4d23a7",
  databaseURL: "https://shut-app-c0067-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);

// Auth with AsyncStorage persistence (keeps user logged in between sessions)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore (for events, festivals, cameras, users)
export const db = getFirestore(app);

// Realtime Database (for chat - lower latency than Firestore for messages)
export const rtdb = getDatabase(app);

// Cloud Functions (for Mux API calls - secrets stay server-side)
export const functions = getFunctions(app, 'europe-west1');

export default app;
