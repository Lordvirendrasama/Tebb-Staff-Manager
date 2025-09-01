'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/constants';

export interface EmployeeOfTheWeek {
  employeeName: User;
  awardedAt: Date;
}

const awardDocRef = doc(db, 'awards', 'employeeOfTheWeek');

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
  await setDoc(awardDocRef, {
    employeeName,
    awardedAt: serverTimestamp(),
  });
}

export async function getEmployeeOfTheWeek(): Promise<EmployeeOfTheWeek | null> {
  const docSnap = await getDoc(awardDocRef);

  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();

  return {
    employeeName: data.employeeName,
    awardedAt: (data.awardedAt as Timestamp).toDate(),
  };
}
