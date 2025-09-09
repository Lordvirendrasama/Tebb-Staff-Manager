
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

const firebaseConfig: FirebaseOptions = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

let firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
let auth: Auth = getAuth(firebaseApp);
let db: Firestore = getFirestore(firebaseApp);

setPersistence(auth, inMemoryPersistence);

let adminApp: App;
let adminDb: admin.firestore.Firestore;

function initializeAdminApp() {
  if (getAdminApps().length > 0) {
    return getAdminApp();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin SDK will not be initialized.'
    );
    return;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminDb = admin.firestore();
  } catch (error: any) {
    throw new Error(
      `Error initializing Firebase Admin SDK. Please check if FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON object. Details: ${error.message}`
    );
  }
}

initializeAdminApp();

export {firebaseApp, auth, db, adminApp, adminDb};
