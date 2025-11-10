
'use server';

import { 
    collection, getDocs, query, where, orderBy, limit, addDoc
} from 'firebase/firestore';
import type { User, AttendanceStatus, AttendanceLog, Employee, LeaveRequest, WeekDay } from '@/lib/constants';
import { differenceInHours, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
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

export async function getMonthlyWorkPerformance(): Promise<Array<{ name: User, overtime: number, undertime: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    const employees = await getEmployees();
    const employeeMap = new Map(employees.map(e => [e.name, e]));

    const attendanceQuery = query(collection(db, 'attendanceLogs'));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const allAttendanceLogs = await Promise.all(attendanceSnapshot.docs.map(doc => docWithDates<AttendanceLog>(doc)));

    const attendanceLogsInMonth = allAttendanceLogs.filter(log => new Date(log.clockIn) >= monthStart);
    
    const filteredLogs = attendanceLogsInMonth.filter(log => log.clockOut);

    const performanceByUser: Record<User, { overtime: number, undertime: number }> = employees.reduce((acc, emp) => {
        acc[emp.name] = { overtime: 0, undertime: 0 };
        return acc;
    }, {} as Record<User, { overtime: number, undertime: number }>);

    filteredLogs.forEach(log => {
        const employee = employeeMap.get(log.employeeName);
        if (employee && log.clockOut) {
            const hoursWorked = differenceInHours(new Date(log.clockOut), new Date(log.clockIn));
            const difference = hoursWorked - employee.standardWorkHours;

            if (performanceByUser[log.employeeName] !== undefined) {
                 if (difference > 0) {
                    performanceByUser[log.employeeName].overtime += difference;
                } else if (difference < 0) {
                    performanceByUser[log.employeeName].undertime += Math.abs(difference);
                }
            }
        }
    });

    return employees.map(emp => ({ 
        name: emp.name, 
        overtime: performanceByUser[emp.name]?.overtime || 0,
        undertime: performanceByUser[emp.name]?.undertime || 0,
    }));
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

export async function getLeaveRequestsForUser(user: User): Promise<LeaveRequest[]> {
    const q = query(
        collection(db, 'leaveRequests'),
        where('employeeName', '==', user),
        orderBy('startDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(doc => docWithDates<LeaveRequest>(doc)));
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const q = query(
        collection(db, 'leaveRequests'),
        orderBy('startDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(doc => docWithDates<LeaveRequest>(doc)));
}


export async function getMonthlyLeaves(): Promise<Array<{ name: User; leaveDays: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const employees = await getEmployees();
    
    const q = query(
        collection(db, 'leaveRequests'),
        where('startDate', '<=', monthEnd)
    );
    const querySnapshot = await getDocs(q);
    const allLeaveRequests = await Promise.all(querySnapshot.docs.map(doc => docWithDates<LeaveRequest>(doc)));

    const leaveRequests = allLeaveRequests.filter(req => {
        const reqEndDate = new Date(req.endDate);
        const isApproved = req.status === 'Approved';
        const isInMonth = reqEndDate >= monthStart;
        return isApproved && isInMonth;
    });


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
    
    const employeeMap = new Map(employees.map(e => [e.name, e]));

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
