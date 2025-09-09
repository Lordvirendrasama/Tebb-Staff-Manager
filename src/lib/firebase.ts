
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


// Server-side admin app - THIS IS THE CORRECTED IMPLEMENTATION
function initializeAdminApp(): admin.App | undefined {
    // If the admin app is already initialized, return it.
    if (admin.apps.length) {
        return admin.app();
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    // If the key is not available, log a warning and exit.
    if (!serviceAccountKey) {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Firebase Admin SDK will not be initialized on the server. Server-side Firebase features will be unavailable.");
        return undefined;
    }
    
    try {
      // Decode and parse the service account key from the environment variable.
      const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
      
      // Initialize the Firebase Admin SDK with the credentials.
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK. Please check if FIREBASE_SERVICE_ACCOUNT_KEY is a valid base64-encoded JSON object.", error);
      return undefined;
    }
}

const adminApp = initializeAdminApp();
export const adminDb: AdminFirestore | undefined = adminApp ? getAdminFirestore(adminApp) : undefined;
