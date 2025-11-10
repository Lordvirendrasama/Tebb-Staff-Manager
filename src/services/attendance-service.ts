
'use server';

import { 
    collection, getDocs, query, where, orderBy, limit, addDoc
} from 'firebase/firestore';
import type { User, AttendanceStatus, AttendanceLog, Employee, WeekDay } from '@/lib/constants';
import { db } from '@/lib/firebase-client';

async function docWithDates<T>(docSnap: any): Promise<T> {
    const data = docSnap.data();
    if (!data) {
        throw new Error('Document data is empty');
    }
    
    const convertedData: { [key: string]: any } = { id: docSnap.id };
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
            convertedData[key] = value.toDate();
        } else {
            convertedData[key] = value;
        }
    }
    return convertedData as T;
}

export async function getAttendanceStatus(user: User): Promise<AttendanceStatus> {
    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', user),
        orderBy('clockIn', 'desc'),
        limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { status: 'Clocked Out' };
    }
    
    const latestLog = await docWithDates<AttendanceLog>(querySnapshot.docs[0]);

    if (latestLog && !latestLog.clockOut) {
        return { status: 'Clocked In', clockInTime: latestLog.clockIn };
    }

    return { status: 'Clocked Out' };
}

export async function getAttendanceHistory(user: User): Promise<AttendanceLog[]> {
    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', user),
        orderBy('clockIn', 'desc'),
        limit(50)
    );
    const querySnapshot = await getDocs(q);
    const logs = await Promise.all(querySnapshot.docs.map(doc => docWithDates<AttendanceLog>(doc)));
    
    return logs.slice(0, 10);
}


export const getEmployees = async (): Promise<Employee[]> => {
    const snapshot = await getDocs(collection(db, 'employees'));
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    // Manually serialize date fields to prevent passing Date objects to client components
    return employees.map(emp => {
        if (emp.payStartDate && typeof emp.payStartDate.toDate === 'function') {
            emp.payStartDate = emp.payStartDate.toDate().toISOString();
        }
        return emp as Employee;
    });
};

export const addEmployee = async (employee: { name: string; weeklyOffDay: WeekDay; standardWorkHours: number; }): Promise<void> => {
    await addDoc(collection(db, 'employees'), employee);
}
