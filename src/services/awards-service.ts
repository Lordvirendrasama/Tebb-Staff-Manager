
'use server';

import type { User } from '@/lib/constants';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { getEmployees } from './attendance-service';

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
    const employees = await getEmployees();
    const employeeNames = employees.map(e => e.name);
    if (employeeNames.includes(employeeName)) {
        await setDoc(doc(db, 'awards', 'employeeOfTheWeek'), { employeeName: employeeName });
    } else {
        throw new Error("Employee not found");
    }
}

export async function getEmployeeOfTheWeek(): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'awards', 'employeeOfTheWeek'));
    if (docSnap.exists()) {
        return docSnap.data()?.employeeName ?? null;
    }
    return null;
}
