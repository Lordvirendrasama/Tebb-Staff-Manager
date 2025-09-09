
'use server';

import type { User } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function getDb() {
  if (!adminDb) {
    // This is the error that will be thrown if the admin SDK is not initialized.
    throw new Error('Firebase Admin SDK is not initialized. Check server logs for details.');
  }
  return adminDb;
}

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
  const db = await getDb();
  
  const awardRef = doc(db, 'awards', 'employeeOfTheWeek');
  await setDoc(awardRef, { employeeName, awardedAt: new Date() });
}

export async function getEmployeeOfTheWeek(): Promise<User | null> {
  // Gracefully handle missing adminDb on page load to avoid crashing the app.
  if (!adminDb) {
    console.log("Firebase Admin not available, can't get Employee of the Week.");
    return null;
  }

  const awardRef = doc(adminDb, 'awards', 'employeeOfTheWeek');
  const docSnap = await getDoc(awardRef);

  if (docSnap.exists()) {
    return docSnap.data().employeeName as User;
  } else {
    return null;
  }
}
