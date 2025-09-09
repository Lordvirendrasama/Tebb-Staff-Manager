
import { initializeApp, getApps, getApp, App } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Client-side app
let app: App;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
export const db = getFirestore(app);


// Server-side admin app
function initializeAdminApp(): admin.App {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Firebase Admin SDK cannot be initialized.");
    }
    
    try {
      const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
      
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
      throw new Error(`Error initializing Firebase Admin SDK. Please check if FIREBASE_SERVICE_ACCOUNT_KEY is a valid base64-encoded JSON object. Details: ${error.message}`);
    }
}

const adminApp = initializeAdminApp();
export const adminDb: AdminFirestore = getAdminFirestore(adminApp);
