
'use server';

import type { User } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function getDb() {
  // adminDb getter already handles initialization.
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
  try {
    const db = await getDb();
    // Gracefully handle missing adminDb on page load to avoid crashing the app.
    if (!db) {
      console.warn("Firebase Admin not available, can't get Employee of the Week.");
      return null;
    }

    const awardRef = doc(db, 'awards', 'employeeOfTheWeek');
    const docSnap = await getDoc(awardRef);

    if (docSnap.exists()) {
      return docSnap.data().employeeName as User;
    } else {
      return null;
    }
  } catch(e) {
      console.error("Could not fetch employee of the week", e);
      return null;
  }
}
