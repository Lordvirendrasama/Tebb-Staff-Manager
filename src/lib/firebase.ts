
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!getApps().length) {
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    projectId: "trackeat-kdfs1"
  });
}

const db = getFirestore();

export { db };
