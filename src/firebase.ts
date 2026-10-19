import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const getEnvOrFallback = (name: string, fallback: string): string => {
    const value = process.env[name];
    return value && value.trim().length > 0 ? value : fallback;
};

export const isFirebaseConfigured = Boolean(
    process.env.REACT_APP_FIREBASE_API_KEY &&
    process.env.REACT_APP_FIREBASE_PROJECT_ID &&
    process.env.REACT_APP_FIREBASE_API_KEY !== 'your-api-key'
);

const firebaseConfig = {
    apiKey: getEnvOrFallback('REACT_APP_FIREBASE_API_KEY', 'AIzaSyDemoKeyForLocalPreviewOnly0000000'),
    authDomain: getEnvOrFallback('REACT_APP_FIREBASE_AUTH_DOMAIN', 'kurumsal-ybs-demo.firebaseapp.com'),
    projectId: getEnvOrFallback('REACT_APP_FIREBASE_PROJECT_ID', 'kurumsal-ybs-demo'),
    storageBucket: getEnvOrFallback('REACT_APP_FIREBASE_STORAGE_BUCKET', 'kurumsal-ybs-demo.appspot.com'),
    messagingSenderId: getEnvOrFallback('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', '1234567890'),
    appId: getEnvOrFallback('REACT_APP_FIREBASE_APP_ID', '1:1234567890:web:abcdef123456'),
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };
export default app;
