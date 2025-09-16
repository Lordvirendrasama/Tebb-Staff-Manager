
'use server';

import type { User, ConsumptionLog, AttendanceLog, Employee, LeaveRequest } from './constants';
import { collection, getDocs, addDoc, updateDoc, doc as clientDoc, query, where, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db as clientDb } from './firebase-client';
import { db } from './firebase-server';
import { getDoc, setDoc, writeBatch } from 'firebase-admin/firestore';


function docWithDates<T>(docSnap: any): T {
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

export const getConsumptionLogs = async (): Promise<ConsumptionLog[]> => {
    const snapshot = await getDocs(collection(clientDb, 'consumptionLogs'));
    return snapshot.docs.map(doc => docWithDates<ConsumptionLog>(doc));
};

export const addConsumptionLog = async (log: Omit<ConsumptionLog, 'id'>) => {
    await addDoc(collection(clientDb, 'consumptionLogs'), log);
};

export const getAttendanceLogs = async (): Promise<AttendanceLog[]> => {
    const snapshot = await getDocs(collection(clientDb, 'attendanceLogs'));
    return snapshot.docs.map(doc => docWithDates<AttendanceLog>(doc));
};

export const addAttendanceLog = async (log: Omit<AttendanceLog, 'id'>) => {
    await addDoc(collection(clientDb, 'attendanceLogs'), log);
};

export const updateLatestAttendanceLogForUser = async (user: User, updates: Partial<AttendanceLog>) => {
    const q = query(collection(clientDb, 'attendanceLogs'),
        where('employeeName', '==', user),
        orderBy('clockIn', 'desc'),
        limit(1));

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await updateDoc(clientDoc(clientDb, 'attendanceLogs', docId), updates);
    }
};

export const getEmployeeOfTheWeek = async (): Promise<User | null> => {
    const docRef = db.collection('awards').doc('employeeOfTheWeek');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists) {
        return docSnap.data()?.employeeName ?? null;
    }
    return null;
};


export const setEmployeeOfTheWeek = async (user: User | null) => {
    await setDoc(db.collection('awards').doc('employeeOfTheWeek'), { employeeName: user });
};

export const getEmployees = async (): Promise<Employee[]> => {
    const snapshot = await db.collection('employees').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}

export const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    await db.collection('employees').add(employee);
}

export const updateEmployee = async (employeeId: string, updates: Partial<Omit<Employee, 'id'>>) => {
    await db.collection('employees').doc(employeeId).update(updates);
}

export const deleteEmployee = async (employeeId: string) => {
    const employeeRef = db.collection('employees').doc(employeeId);
    const employeeDoc = await getDoc(employeeRef);
    if (!employeeDoc.exists) return;

    const employeeName = employeeDoc.data()?.name;
    
    await employeeRef.delete();

    if (!employeeName) return;

    const batch = writeBatch(db);
    const collectionsToDelete = ['consumptionLogs', 'attendanceLogs', 'leaveRequests'];
    
    for (const collectionName of collectionsToDelete) {
        const snapshot = await db.collection(collectionName).where('employeeName', '==', employeeName).get();
        if (!snapshot.empty) {
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }
    }
    
    await batch.commit();

    const eow = await getEmployeeOfTheWeek();
    if (eow === employeeName) {
        await setEmployeeOfTheWeek(null);
    }
}


export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const snapshot = await getDocs(collection(clientDb, 'leaveRequests'));
    return snapshot.docs.map(doc => docWithDates<LeaveRequest>(doc));
}

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id'>) => {
    await addDoc(collection(clientDb, 'leaveRequests'), request);
}

export const updateLeaveRequest = async (requestId: string, updates: Partial<Omit<LeaveRequest, 'id'>>) => {
    await updateDoc(clientDoc(clientDb, 'leaveRequests', requestId), updates);
}
