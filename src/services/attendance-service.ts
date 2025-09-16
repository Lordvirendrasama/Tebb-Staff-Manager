
'use client';

import { 
    collection, getDocs, query, where, orderBy, limit, doc, updateDoc, addDoc, writeBatch, getDoc, deleteDoc
} from 'firebase/firestore';
import type { User, AttendanceStatus, AttendanceLog, Employee, LeaveRequest, LeaveType } from '@/lib/constants';
import { differenceInHours, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { db } from '@/lib/firebase-client';
import { getEmployeeOfTheWeek, setEmployeeOfTheWeek } from './awards-service';

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

async function docsWithDates<T>(querySnapshot: any): Promise<T[]> {
    const promises: Promise<T>[] = [];
    querySnapshot.forEach((doc: any) => {
        promises.push(docWithDates<T>(doc));
    });
    return Promise.all(promises);
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

export async function clockIn(user: User): Promise<void> {
    const now = new Date();
    await addDoc(collection(db, 'attendanceLogs'), {
        employeeName: user,
        clockIn: now,
        clockOut: null,
    });
}

export async function clockOut(user: User): Promise<void> {
    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', user),
        orderBy('clockIn', 'desc'),
        limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docRef = doc(db, 'attendanceLogs', querySnapshot.docs[0].id);
        await updateDoc(docRef, { clockOut: new Date() });
    }
}

export async function getAttendanceHistory(user: User): Promise<AttendanceLog[]> {
    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', user),
        orderBy('clockIn', 'desc'),
        limit(10)
    );
    const querySnapshot = await getDocs(q);
    return docsWithDates<AttendanceLog>(querySnapshot);
}

export async function getMonthlyOvertime(): Promise<Array<{ name: User, overtime: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    const employees = await getEmployees();
    const employeeMap = new Map(employees.map(e => [e.name, e]));

    const attendanceQuery = query(
        collection(db, 'attendanceLogs'),
        where('clockIn', '>=', monthStart)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceLogs = await docsWithDates<AttendanceLog>(attendanceSnapshot);
    
    const filteredLogs = attendanceLogs.filter(log => log.clockOut);

    const overtimeByUser: Record<User, number> = employees.reduce((acc, emp) => {
        acc[emp.name] = 0;
        return acc;
    }, {} as Record<User, number>);

    filteredLogs.forEach(log => {
        const employee = employeeMap.get(log.employeeName);
        if (employee && log.clockOut) {
            const hoursWorked = differenceInHours(new Date(log.clockOut), new Date(log.clockIn));
            const overtime = Math.max(0, hoursWorked - employee.standardWorkHours);
            if (overtimeByUser[log.employeeName] !== undefined) {
                overtimeByUser[log.employeeName] += overtime;
            }
        }
    });

    return employees.map(emp => ({ name: emp.name, overtime: overtimeByUser[emp.name] || 0 }));
}

export const getEmployees = async (): Promise<Employee[]> => {
    const snapshot = await getDocs(collection(db, 'employees'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}

export const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    await addDoc(collection(db, 'employees'), employee);
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

    const batch = writeBatch(db);
    const collectionsToDelete = ['consumptionLogs', 'attendanceLogs', 'leaveRequests'];
    
    for (const collectionName of collectionsToDelete) {
        const q = query(collection(db, collectionName), where('employeeName', '==', employeeName));
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


export async function requestLeave(user: User, startDate: Date, endDate: Date, reason: string, leaveType: LeaveType): Promise<void> {
    await addDoc(collection(db, 'leaveRequests'), {
        employeeName: user,
        startDate,
        endDate,
        reason,
        leaveType,
        status: 'Pending',
    });
}

export async function getLeaveRequestsForUser(user: User): Promise<LeaveRequest[]> {
    const q = query(
        collection(db, 'leaveRequests'),
        where('employeeName', '==', user),
        orderBy('startDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return docsWithDates<LeaveRequest>(querySnapshot);
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const q = query(
        collection(db, 'leaveRequests'),
        orderBy('startDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return docsWithDates<LeaveRequest>(querySnapshot);
}

export async function approveLeave(requestId: string): Promise<void> {
    const docRef = doc(db, 'leaveRequests', requestId);
    await updateDoc(docRef, { status: 'Approved' });
}

export async function denyLeave(requestId: string): Promise<void> {
    const docRef = doc(db, 'leaveRequests', requestId);
    await updateDoc(docRef, { status: 'Denied' });
}

export async function updateLeaveType(requestId: string, leaveType: LeaveType): Promise<void> {
    const docRef = doc(db, 'leaveRequests', requestId);
    await updateDoc(docRef, { leaveType });
}

export async function getMonthlyLeaves(): Promise<Array<{ name: User; leaveDays: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const employees = await getEmployees();
    const employeeMap = new Map(employees.map(e => [e.name, e]));
    
    const q = query(
        collection(db, 'leaveRequests'),
        where('status', '==', 'Approved'),
        where('startDate', '<=', monthEnd)
    );
    const querySnapshot = await getDocs(q);
    const leaveRequests = (await docsWithDates<LeaveRequest>(querySnapshot)).filter(req => new Date(req.endDate) >= monthStart);

    const leaveDaysByUser: Record<User, number> = employees.reduce((acc, emp) => {
        acc[emp.name] = 0;
        return acc;
    }, {} as Record<User, number>);

    const getWeekDayNumber = (day: 'Sunday'|'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'): number => {
        const dayMap = {
            Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
        };
        return dayMap[day];
    };

    leaveRequests.forEach(req => {
        const interval = {
            start: new Date(req.startDate) < monthStart ? monthStart : new Date(req.startDate),
            end: new Date(req.endDate) > monthEnd ? monthEnd : new Date(req.endDate)
        };

        const employee = employeeMap.get(req.employeeName);
        if (employee) {
            const daysInInterval = eachDayOfInterval(interval);
            const offDayNumber = getWeekDayNumber(employee.weeklyOffDay);
            
            const workDays = daysInInterval.filter(day => day.getDay() !== offDayNumber).length;

            if (isSameDay(interval.start, interval.end)) {
                 if(new Date(interval.start).getDay() !== offDayNumber) {
                    leaveDaysByUser[req.employeeName] = (leaveDaysByUser[req.employeeName] || 0) + 1;
                 }
            } else {
                 leaveDaysByUser[req.employeeName] = (leaveDaysByUser[req.employeeName] || 0) + workDays;
            }
        }
    });
    
    return employees.map(emp => ({ name: emp.name, leaveDays: leaveDaysByUser[emp.name] || 0 }));
}
export { getAllUsersAllowances } from '@/services/consumption-log-service';
