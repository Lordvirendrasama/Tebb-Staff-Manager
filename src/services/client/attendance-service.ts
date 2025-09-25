
'use client';

import { collection, onSnapshot, query, orderBy, doc, getDocs, where } from 'firebase/firestore';
import * as serverService from '../attendance-service';
import { db } from '@/lib/firebase-client';
import type { Employee, LeaveRequest, AttendanceLog } from '@/lib/constants';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// This file exports server functions for client-side use.
// This is the correct way to expose server functions to client components
// without marking the entire service file as a client module.

function makeEmployeeSerializable(emp: Employee): Employee {
    const serializableEmp: any = { ...emp };
    if (emp.payStartDate) {
        // Handle both Firestore Timestamps and Date objects
        const date = emp.payStartDate.toDate ? emp.payStartDate.toDate() : new Date(emp.payStartDate);
        serializableEmp.payStartDate = date.toISOString();
    }
    return serializableEmp as Employee;
}

const getEmployees = async (): Promise<Employee[]> => {
    const employees = await serverService.getEmployees();
    // Convert any Date/Timestamp objects to string to make them serializable for client components
    return employees.map(makeEmployeeSerializable);
};

export const getAttendanceStatus = serverService.getAttendanceStatus;
export const getAttendanceHistory = serverService.getAttendanceHistory;
export const getMonthlyOvertime = serverService.getMonthlyOvertime;
export { getEmployees };
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

export const onEmployeesSnapshot = (
    callback: (employees: Employee[]) => void,
    onError: (error: Error) => void
) => {
    const q = query(collection(db, 'employees'), orderBy('name'));
    return onSnapshot(q, 
        (snapshot) => {
            const employees = snapshotToDocs<Employee>(snapshot);
            // Ensure employees are serializable before passing to client components
            const serializableEmployees = employees.map(makeEmployeeSerializable);
            callback(serializableEmployees);
        },
        (error) => {
            console.error("Error listening to employees collection:", error);
            onError(error);
        }
    );
};

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

    // Query by employee and order by date
    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employeeName),
        orderBy('clockIn', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const allLogs = snapshotToDocs<AttendanceLog>(querySnapshot);
    
    // Filter by date range in the client
    const logsInMonth = allLogs.filter(log => 
        isWithinInterval(log.clockIn, { start, end })
    );

    return logsInMonth;
};
