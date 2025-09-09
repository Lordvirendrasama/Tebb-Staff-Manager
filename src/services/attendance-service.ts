
import type { User, AttendanceStatus, AttendanceLog, LeaveRequest } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { startOfDay, endOfDay } from 'date-fns';

async function getDb() {
    if (!adminDb) {
        throw new Error('Firebase Admin SDK is not initialized.');
    }
    return adminDb;
}

export async function getAttendanceStatus(user: User): Promise<AttendanceStatus> {
    const db = await getDb();
    const todayStart = startOfDay(new Date());

    const snapshot = await db.collection('attendance-logs')
        .where('employeeName', '==', user)
        .where('clockIn', '>=', todayStart)
        .orderBy('clockIn', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) {
        return { status: 'Clocked Out' };
    }

    const latestLog = snapshot.docs[0].data() as AttendanceLog;

    if (!latestLog.clockOut) {
        return { status: 'Clocked In', clockInTime: latestLog.clockIn.toDate() };
    }

    return { status: 'Clocked Out' };
}

export async function clockIn(user: User): Promise<void> {
    const db = await getDb();
    const now = new Date();
    const log: AttendanceLog = {
        employeeName: user,
        clockIn: now,
    };
    await db.collection('attendance-logs').add(log);
}

export async function clockOut(user: User): Promise<void> {
    const db = await getDb();
    const todayStart = startOfDay(new Date());

    const snapshot = await db.collection('attendance-logs')
        .where('employeeName', '==', user)
        .where('clockIn', '>=', todayStart)
        .orderBy('clockIn', 'desc')
        .limit(1)
        .get();

    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        if (!doc.data().clockOut) {
            await doc.ref.update({ clockOut: new Date() });
        }
    }
}

export async function getAttendanceHistory(user: User): Promise<AttendanceLog[]> {
    const db = await getDb();
    const snapshot = await db.collection('attendance-logs')
        .where('employeeName', '==', user)
        .orderBy('clockIn', 'desc')
        .limit(10)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            clockIn: data.clockIn.toDate(),
            clockOut: data.clockOut?.toDate(),
        } as AttendanceLog;
    });
}

export async function requestLeave(user: User, leaveDate: Date, reason: string): Promise<void> {
    const db = await getDb();
    const request: LeaveRequest = {
        employeeName: user,
        leaveDate,
        reason,
        status: 'Pending',
    };
    await db.collection('leave-requests').add(request);
}

export async function getLeaveRequests(user: User): Promise<LeaveRequest[]> {
    const db = await getDb();
    const snapshot = await db.collection('leave-requests')
        .where('employeeName', '==', user)
        .orderBy('leaveDate', 'desc')
        .limit(10)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            leaveDate: data.leaveDate.toDate(),
        } as LeaveRequest;
    });
}
