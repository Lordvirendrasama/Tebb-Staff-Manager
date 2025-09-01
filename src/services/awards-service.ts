
'use server';

import { adminDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/constants';

export interface EmployeeOfTheWeek {
  employeeName: User;
  awardedAt: Date;
}

async function getDb() {
    if (!adminDb) {
        // Return null instead of throwing an error if the admin SDK is not initialized.
        return null;
    }
    return adminDb;
}

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const awardDocRef = doc(db, 'awards', 'employeeOfTheWeek');
  await setDoc(awardDocRef, {
    employeeName,
    awardedAt: serverTimestamp(),
  });
}

export async function getEmployeeOfTheWeek(): Promise<EmployeeOfTheWeek | null> {
  const db = await getDb();
  if (!db) return null;

  const awardDocRef = doc(db, 'awards', 'employeeOfTheWeek');
  const docSnap = await getDoc(awardDocRef);

  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();

  // Handle case where awardedAt is null on first set
  if (!data.awardedAt) {
    return {
      employeeName: data.employeeName,
      awardedAt: new Date(), // Or a sensible default
    }
  }

  return {
    employeeName: data.employeeName,
    awardedAt: (data.awardedAt as Timestamp).toDate(),
  };
}
