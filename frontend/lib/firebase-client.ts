import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(`Firebase config is incomplete: ${missingKeys.join(', ')}`);
}

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

type FirebaseAuthWithReactNativePersistence = typeof FirebaseAuth & {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
};

const firebaseAuthModule = FirebaseAuth as FirebaseAuthWithReactNativePersistence;

export const auth = (() => {
  try {
    if (firebaseAuthModule.getReactNativePersistence) {
      return FirebaseAuth.initializeAuth(firebaseApp, {
        persistence: firebaseAuthModule.getReactNativePersistence(AsyncStorage),
      });
    }
  } catch {
    // initializeAuth may already be active; fallback to getAuth below.
  }

  return FirebaseAuth.getAuth(firebaseApp);
})();
