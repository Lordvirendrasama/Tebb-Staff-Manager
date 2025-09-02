'use server';

import type { User } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function getDb() {
  if (!adminDb) {
    return null;
  }
  return adminDb;
}

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Firebase Admin SDK is not initialized. Cannot set Employee of the Week.');
  }

  const awardRef = doc(db, 'awards', 'employeeOfTheWeek');
  await setDoc(awardRef, { employeeName, awardedAt: new Date() });
}

export async function getEmployeeOfTheWeek(): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    console.log('Firebase Admin SDK is not initialized. Cannot get Employee of the Week.');
    return null;
  }

  const awardRef = doc(db, 'awards', 'employeeOfTheWeek');
  const docSnap = await getDoc(awardRef);

  if (docSnap.exists()) {
    // Optional: You could add logic here to check if the award is still valid (e.g., within the last 7 days)
    return docSnap.data().employeeName as User;
  } else {
    return null;
  }
}
