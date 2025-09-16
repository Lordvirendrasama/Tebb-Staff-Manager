
import { initializeApp, getApps, App, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApp();
  }
  
  // This will use Application Default Credentials
  // For local development, you should set up Application Default Credentials by running
  // `gcloud auth application-default login` in your terminal.
  const app = initializeApp();
  
  return app;
};

const app = getAdminApp();
const db = getFirestore(app);

export { db, app };
