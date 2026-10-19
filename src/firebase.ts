import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const getRequiredEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required Firebase environment variable: ${name}`);
    }
    return value;
};

const firebaseConfig = {
    apiKey: getRequiredEnv('REACT_APP_FIREBASE_API_KEY'),
    authDomain: getRequiredEnv('REACT_APP_FIREBASE_AUTH_DOMAIN'),
    projectId: getRequiredEnv('REACT_APP_FIREBASE_PROJECT_ID'),
    storageBucket: getRequiredEnv('REACT_APP_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getRequiredEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getRequiredEnv('REACT_APP_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };
export default app;
