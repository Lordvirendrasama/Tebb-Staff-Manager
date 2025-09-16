
'use client';

import type { User } from '@/lib/constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export async function getEmployeeOfTheWeek(): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'awards', 'employeeOfTheWeek'));
    if (docSnap.exists()) {
        return docSnap.data()?.employeeName ?? null;
    }
    return null;
}
