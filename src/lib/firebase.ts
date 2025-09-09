
import {initializeApp, getApps, getApp, FirebaseOptions} from 'firebase/app';
import {getFirestore, Firestore} from 'firebase/firestore';
import {
  getAuth,
  setPersistence,
  inMemoryPersistence,
  Auth,
} from 'firebase/auth';
import admin from 'firebase-admin';
import {App, getApp as getAdminApp, getApps as getAdminApps} from 'firebase-admin/app';
import { config } from 'dotenv';

config();

const firebaseConfig: FirebaseOptions = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

let firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
let auth: Auth = getAuth(firebaseApp);
let db: Firestore = getFirestore(firebaseApp);

setPersistence(auth, inMemoryPersistence);

let adminApp: App;
let adminDb: admin.firestore.Firestore;

function initializeAdminApp() {
    if (getAdminApps().length > 0) {
        adminApp = getAdminApp();
        adminDb = admin.firestore();
        return;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        console.warn('Firebase Admin SDK credentials are not set. Admin features will be disabled.');
        return;
    }

    try {
        adminApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        adminDb = admin.firestore();
    } catch (error: any) {
        console.error(`Error initializing Firebase Admin SDK: ${error.message}`);
    }
}

initializeAdminApp();

export {firebaseApp, auth, db, adminApp, adminDb};
