
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  app = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    projectId: process.env.GCLOUD_PROJECT,
  });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export { db };
