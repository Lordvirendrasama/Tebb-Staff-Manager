'use client';

import { collection, onSnapshot, query, orderBy, doc, getDocs, where } from 'firebase/firestore';
import * as serverService from '../attendance-service';
import { db } from '@/lib/firebase-client';
import type { Employee, LeaveRequest, AttendanceLog, Payroll } from '@/lib/constants';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

function makeSerializable<T>(obj: any): T {
    const serializableObj: { [key: string]: any } = { ...obj };
    for (const key in serializableObj) {
        const value = serializableObj[key];
        if (value && typeof value.toDate === 'function') {
            serializableObj[key] = value.toDate().toISOString();
        } else if (value instanceof Date) {
            serializableObj[key] = value.toISOString();
        }
    }
    return serializableObj as T;
}

export const getAttendanceStatus = serverService.getAttendanceStatus;
export const getAttendanceHistory = serverService.getAttendanceHistory;
export const getMonthlyWorkPerformance = serverService.getMonthlyWorkPerformance;
export const getEmployees = serverService.getEmployees;
export const addEmployee = serverService.addEmployee;
export const getLeaveRequestsForUser = serverService.getLeaveRequestsForUser;
export const getAllLeaveRequests = serverService.getAllLeaveRequests;
export const getMonthlyLeaves = serverService.getMonthlyLeaves;

function snapshotToDocs<T>(snapshot: any): T[] {
    if (!snapshot.docs) return [];
    return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const convertedData: { [key: string]: any } = { id: doc.id };
        for (const key in data) {
            const value = data[key];
            if (value && typeof value.toDate === 'function') {
                convertedData[key] = value.toDate();
            } else {
                convertedData[key] = value;
            }
        }
        return convertedData as T;
    });
}

export const onLeaveRequestsSnapshot = (
    callback: (requests: LeaveRequest[]) => void,
    onError: (error: Error) => void
) => {
    const q = query(collection(db, 'leaveRequests'), orderBy('startDate', 'desc'));
    return onSnapshot(q,
        (snapshot) => {
            const requests = snapshotToDocs<LeaveRequest>(snapshot);
            callback(requests);
        },
        (error) => {
            console.error("Error listening to leave requests collection:", error);
            onError(error);
        }
    );
};

export const getAttendanceForMonth = async (employeeName: string, month: Date): Promise<AttendanceLog[]> => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employeeName),
        orderBy('clockIn', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const allLogs = snapshotToDocs<AttendanceLog>(querySnapshot);
    
    const logsInMonth = allLogs.filter(log => 
        isWithinInterval(new Date(log.clockIn), { start, end })
    );

    return logsInMonth;
};

export const getAllAttendanceForMonth = async (employeeName: string, month: Date): Promise<AttendanceLog[]> => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employeeName),
        orderBy('clockIn', 'asc')
    );

    const snapshot = await getDocs(q);
    const allLogs = snapshotToDocs<AttendanceLog>(snapshot);

    // Filter by month on the client-side
    return allLogs.filter(log => 
        isWithinInterval(new Date(log.clockIn), { start, end })
    );
};


export const onUserPayrollSnapshot = (
    userName: string,
    callback: (payrolls: Payroll[]) => void,
    onError: (error: Error) => void
) => {
    const q = query(
        collection(db, 'payroll'),
        where('employeeName', '==', userName),
        orderBy('payPeriodStart', 'desc')
    );
    return onSnapshot(q, 
        (snapshot) => {
            const payrolls = snapshotToDocs<Payroll>(snapshot);
            callback(payrolls);
        },
        onError
    );
};
