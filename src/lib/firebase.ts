
import { initializeApp, getApps, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!getApps().length) {
  const appOptions: AppOptions = {
    projectId: "trackeat-kdfs1"
  };
  if (serviceAccount) {
    appOptions.credential = cert(serviceAccount);
  }
  initializeApp(appOptions);
}

const db = getFirestore();

export { db };
