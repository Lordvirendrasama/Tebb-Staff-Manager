
import * as admin from 'firebase-admin';

// This is the only place where the Firebase Admin SDK is initialized.
// It is called only ONCE by the server.
let db: admin.firestore.Firestore;

const initializeAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    // This is the critical part for Vercel/Netlify deployment
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Missing Firebase environment variables.');
    }

    try {
        const app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log("Firebase Admin SDK Initialized Successfully.");
        return app;
    } catch (error: any) {
        console.error("Firebase Admin SDK Initialization Error:", error.message);
        // Throw a more specific error to help with debugging
        if (error.code === 'app/duplicate-app') {
            return admin.app();
        }
        throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
};


export const getDb = (): admin.firestore.Firestore => {
  if (!db) {
    initializeAdminApp();
    db = admin.firestore();
  }
  return db;
}
