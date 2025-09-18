
'use client';

import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import * as serverService from '../attendance-service';
import { db } from '@/lib/firebase-client';
import type { Employee, LeaveRequest } from '@/lib/constants';

// This file exports server functions for client-side use.
// This is the correct way to expose server functions to client components
// without marking the entire service file as a client module.

export const getAttendanceStatus = serverService.getAttendanceStatus;
export const getAttendanceHistory = serverService.getAttendanceHistory;
export const getMonthlyOvertime = serverService.getMonthlyOvertime;
export const getEmployees = serverService.getEmployees;
export const addEmployee = serverService.addEmployee;
export const getLeaveRequestsForUser = serverService.getLeaveRequestsForUser;
export const getAllLeaveRequests = serverService.getAllLeaveRequests;
export const getMonthlyLeaves = serverService.getMonthlyLeaves;
export const getAllUsersAllowances = serverService.getAllUsersAllowances;

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
            callback(employees);
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
