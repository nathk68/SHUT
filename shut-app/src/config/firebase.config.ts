import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in RN bundle but missing from TS types (Firebase v12 known issue)
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ====================================================================
// FIREBASE CONFIGURATION
// EXPO_PUBLIC_FIREBASE_ENV=dev     → dev/test (shut-app-c0067)
// EXPO_PUBLIC_FIREBASE_ENV=preprod → preprod (shut-app-preprod)
// ====================================================================
const firebaseEnv = process.env.EXPO_PUBLIC_FIREBASE_ENV ?? 'dev';
const devConfig = {
  apiKey: "AIzaSyBX-g-1IlM3r-CELtcVVZi1zx7IHvAnjaE",
  authDomain: "shut-app-c0067.firebaseapp.com",
  projectId: "shut-app-c0067",
  storageBucket: "shut-app-c0067.firebasestorage.app",
  messagingSenderId: "995264496230",
  appId: "1:995264496230:web:f7d8bf8f153b4e4c4d23a7",
  databaseURL: "https://shut-app-c0067-default-rtdb.europe-west1.firebasedatabase.app/",
};

const preprodConfig = {
  apiKey: "AIzaSyAG_UIIgkGR4LCTzG2z56h-k7n3PauMYjg",
  authDomain: "shut-app-preprod.firebaseapp.com",
  projectId: "shut-app-preprod",
  storageBucket: "shut-app-preprod.firebasestorage.app",
  messagingSenderId: "684167800997",
  appId: "1:684167800997:web:ba2e5e6949b6254a93454c",
  databaseURL: "https://shut-app-preprod-default-rtdb.europe-west1.firebasedatabase.app/",
};

const firebaseConfig = firebaseEnv === 'preprod' ? preprodConfig : devConfig;

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

// Storage (for avatar uploads)
export const storage = getStorage(app);

export default app;
