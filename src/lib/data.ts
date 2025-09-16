
'use server';

import type { User, ConsumptionLog, AttendanceLog, Employee, LeaveRequest } from './constants';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase-client';

const getCollection = (collectionName: string) => collection(db, collectionName);

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
    const snapshot = await getDocs(getCollection('consumptionLogs'));
    return snapshot.docs.map(doc => docWithDates<ConsumptionLog>(doc));
};

export const addConsumptionLog = async (log: Omit<ConsumptionLog, 'id'>) => {
    await addDoc(getCollection('consumptionLogs'), log);
};

export const getAttendanceLogs = async (): Promise<AttendanceLog[]> => {
    const snapshot = await getDocs(getCollection('attendanceLogs'));
    return snapshot.docs.map(doc => docWithDates<AttendanceLog>(doc));
};

export const addAttendanceLog = async (log: Omit<AttendanceLog, 'id'>) => {
    await addDoc(getCollection('attendanceLogs'), log);
};

export const updateLatestAttendanceLogForUser = async (user: User, updates: Partial<AttendanceLog>) => {
    const q = query(getCollection('attendanceLogs'),
        where('employeeName', '==', user),
        orderBy('clockIn', 'desc'),
        limit(1));

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'attendanceLogs', docId), updates);
    }
};

export const getEmployeeOfTheWeek = async (): Promise<User | null> => {
    const docRef = doc(db, 'awards', 'employeeOfTheWeek');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data()?.employeeName ?? null;
    }
    return null;
};


export const setEmployeeOfTheWeek = async (user: User | null) => {
    await setDoc(doc(db, 'awards', 'employeeOfTheWeek'), { employeeName: user });
};

export const getEmployees = async (): Promise<Employee[]> => {
    const snapshot = await getDocs(getCollection('employees'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}

export const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    await addDoc(getCollection('employees'), employee);
}

export const updateEmployee = async (employeeId: string, updates: Partial<Omit<Employee, 'id'>>) => {
    await updateDoc(doc(db, 'employees', employeeId), updates);
}

export const deleteEmployee = async (employeeId: string) => {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(employeeRef);
    if (!employeeDoc.exists()) return;

    const employeeName = employeeDoc.data()?.name;
    
    await deleteDoc(employeeRef);

    if (!employeeName) return;

    const collectionsToDelete = ['consumptionLogs', 'attendanceLogs', 'leaveRequests'];
    const batch = writeBatch(db);
    
    for (const collectionName of collectionsToDelete) {
        const q = query(getCollection(collectionName), where('employeeName', '==', employeeName));
        const snapshot = await getDocs(q);
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
    const snapshot = await getDocs(getCollection('leaveRequests'));
    return snapshot.docs.map(doc => docWithDates<LeaveRequest>(doc));
}

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id'>) => {
    await addDoc(getCollection('leaveRequests'), request);
}

export const updateLeaveRequest = async (requestId: string, updates: Partial<Omit<LeaveRequest, 'id'>>) => {
    await updateDoc(doc(db, 'leaveRequests', requestId), updates);
}
