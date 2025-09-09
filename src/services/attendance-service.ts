
'use server';

import type { User, AttendanceLog, AttendanceStatus, LeaveRequest } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, Timestamp, orderBy, limit } from 'firebase/firestore';

async function getDb() {
    if (!adminDb) {
        throw new Error('Firebase Admin SDK is not initialized.');
    }
    return adminDb;
}

export async function clockIn(employeeName: User): Promise<void> {
  const db = await getDb();

  const q = query(
    collection(db, 'attendanceLogs'), 
    where('employeeName', '==', employeeName), 
    where('clockOut', '==', null)
  );
  const existingEntry = await getDocs(q);

  if (!existingEntry.empty) {
    throw new Error('You are already clocked in.');
  }

  await addDoc(collection(db, 'attendanceLogs'), {
    employeeName,
    clockIn: new Date(),
    clockOut: null,
  });
}

export async function clockOut(employeeName: User): Promise<void> {
    const db = await getDb();

    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employeeName),
        where('clockOut', '==', null),
        orderBy('clockIn', 'desc'),
        limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        throw new Error('You are not clocked in.');
    }
    const logDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'attendanceLogs', logDoc.id), {
        clockOut: new Date()
    });
}

export async function getAttendanceStatus(employeeName: User): Promise<AttendanceStatus> {
    try {
        const db = await getDb();

        const q = query(
            collection(db, 'attendanceLogs'),
            where('employeeName', '==', employeeName),
            orderBy('clockIn', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { status: 'Clocked Out' };
        }

        const lastLog = snapshot.docs[0].data();
    
        if (lastLog && !lastLog.clockOut) {
        return { status: 'Clocked In', clockInTime: (lastLog.clockIn as Timestamp).toDate() };
        }
    
        return { status: 'Clocked Out' };
    } catch(e) {
        console.error(`Could not fetch attendance status for user ${employeeName}`, e);
        return { status: 'Clocked Out' };
    }
}
  
export async function getAttendanceHistory(employeeName: User): Promise<AttendanceLog[]> {
    try {
        const db = await getDb();

        const q = query(
            collection(db, 'attendanceLogs'),
            where('employeeName', '==', employeeName),
            orderBy('clockIn', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                employeeName: data.employeeName,
                clockIn: (data.clockIn as Timestamp).toDate(),
                clockOut: data.clockOut ? (data.clockOut as Timestamp).toDate() : undefined,
            }
        });
    } catch(e) {
        console.error(`Could not fetch attendance history for user ${employeeName}`, e);
        return [];
    }
}

export async function getAllAttendanceLogs(): Promise<AttendanceLog[]> {
    try {
        const db = await getDb();

        const q = query(collection(db, 'attendanceLogs'), orderBy('clockIn', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                employeeName: data.employeeName,
                clockIn: (data.clockIn as Timestamp).toDate(),
                clockOut: data.clockOut ? (data.clockOut as Timestamp).toDate() : undefined,
            }
        });
    } catch(e) {
        console.error("Could not fetch all attendance logs", e);
        return [];
    }
}

export async function requestLeave(employeeName: User, leaveDate: Date, reason: string): Promise<void> {
    const db = await getDb();

    await addDoc(collection(db, 'leaveRequests'), {
        employeeName,
        leaveDate,
        reason,
        status: 'Pending',
    });
}

export async function getLeaveRequests(employeeName: User): Promise<LeaveRequest[]> {
    try {
        const db = await getDb();

        const q = query(
            collection(db, 'leaveRequests'), 
            where('employeeName', '==', employeeName),
            orderBy('leaveDate', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                employeeName: data.employeeName,
                leaveDate: (data.leaveDate as Timestamp).toDate(),
                reason: data.reason,
                status: data.status,
            }
        });
    } catch (e) {
        console.error(`Could not fetch leave requests for user ${employeeName}`, e);
        return [];
    }
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    try {
        const db = await getDb();
        
        const q = query(collection(db, 'leaveRequests'), orderBy('leaveDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                employeeName: data.employeeName,
                leaveDate: (data.leaveDate as Timestamp).toDate(),
                reason: data.reason,
                status: data.status,
            }
        });
    } catch (e) {
        console.error("Could not fetch all leave requests", e);
        return [];
    }
}
