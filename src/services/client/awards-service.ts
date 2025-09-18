
'use client';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import * as serverService from '../awards-service';
import type { User } from '@/lib/constants';

export const getEmployeeOfTheWeekAction = serverService.getEmployeeOfTheWeekAction;

export const onEmployeeOfTheWeekSnapshot = (
  callback: (employeeName: User | null) => void,
  onError: (error: Error) => void
) => {
    const docRef = doc(db, 'awards', 'employeeOfTheWeek');
    return onSnapshot(docRef, 
        (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data()?.employeeName ?? null);
            } else {
                callback(null);
            }
        },
        (error) => {
            console.error("Error listening for employee of the week:", error);
            onError(error);
        }
    );
};
