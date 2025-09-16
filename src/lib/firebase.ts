
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
    return globalWithApp[FIREBASE_APP_NAME];
  }

  // When running in a Google Cloud environment (like App Hosting), the SDK
  // will automatically discover the service account credentials.
  // For local development, you should set up Application Default Credentials by running
  // `gcloud auth application-default login` in your terminal.
  const app = initializeApp();

  globalWithApp[FIREBASE_APP_NAME] = app;
  return app;
}

const app = getAdminApp();
const db = getFirestore(app);

export { db, app };
