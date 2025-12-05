import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration from environment variables
// Create a .env file in the root directory with your Firebase credentials
// See .env.example for the template
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate that all required environment variables are present
const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
);

if (missingEnvVars.length > 0) {
    console.error(
        '❌ Missing Firebase environment variables:',
        missingEnvVars.join(', ')
    );
    console.error('📝 Please create a .env file in the root directory.');
    console.error('📋 Copy .env.example and fill in your Firebase credentials.');
    throw new Error('Firebase configuration is incomplete. Check console for details.');
}

// Debug: Show storage bucket value
console.log('🔍 Storage Bucket from .env:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log('🔍 Storage Bucket length:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.length);
console.log('🔍 Storage Bucket JSON:', JSON.stringify(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET));

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
