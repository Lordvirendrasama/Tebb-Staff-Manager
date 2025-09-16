
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Use a global symbol to store the app instance to avoid re-initialization in dev mode.
const FIREBASE_APP_NAME = Symbol.for('firebase-studio-app');

type GlobalWithApp = typeof globalThis & {
  [FIREBASE_APP_NAME]?: App;
};

function getAdminApp(): App {
  const globalWithApp = global as GlobalWithApp;
  if (globalWithApp[FIREBASE_APP_NAME]) {
    return globalWithApp[FIREBA_APP_NAME];
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountString) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
  }

  const serviceAccount = JSON.parse(serviceAccountString);

  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  globalWithApp[FIREBASE_APP_NAME] = app;
  return app;
}

const app = getAdminApp();
const db = getFirestore(app);

export { db, app };
