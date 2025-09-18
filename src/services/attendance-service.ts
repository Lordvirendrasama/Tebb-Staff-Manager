
'use server';

import { 
    collection, getDocs, query, where, orderBy, limit, addDoc
} from 'firebase/firestore';
import type { User, AttendanceStatus, AttendanceLog, Employee, LeaveRequest, WeekDay, ConsumptionLog, DrinkItem, MealItem } from '@/lib/constants';
import { differenceInHours, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { db } from '@/lib/firebase-client';
import { DRINK_ITEMS, MEAL_ITEMS, MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';


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

export async function docsWithDates<T>(querySnapshot: any): Promise<T[]> {
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

export async function getAttendanceHistory(user: User): Promise<AttendanceLog[]> {
    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', user),
        orderBy('clockIn', 'desc'),
        limit(50)
    );
    const querySnapshot = await getDocs(q);
    const logs = await docsWithDates<AttendanceLog>(querySnapshot);
    
    return logs.slice(0, 10);
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
    const allLeaveRequests = await docsWithDates<LeaveRequest>(querySnapshot);

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

export async function getAllUsersAllowances(): Promise<Array<{ user: User; allowances: { drinks: number; meals: number } }>> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const employees = await getEmployees();
    const users = employees.map(e => e.name);
    
    const q = query(
        collection(db, 'consumptionLogs'),
        where('dateTimeLogged', '>=', start),
        where('dateTimeLogged', '<=', end)
    );
    const querySnapshot = await getDocs(q);
    const logs = await docsWithDates<ConsumptionLog>(querySnapshot);

    const userLogs: Record<User, ConsumptionLog[]> = users.reduce((acc, name) => {
        acc[name] = [];
        return acc;
    }, {} as Record<User, ConsumptionLog[]>);

    logs.forEach(log => {
        if (userLogs[log.employeeName]) {
            userLogs[log.employeeName].push(log);
        }
    });

    const allowances = users.map(user => {
        const currentUserLogs = userLogs[user] || [];
        const drinksConsumed = currentUserLogs.filter(log => DRINK_ITEMS.includes(log.itemName as DrinkItem)).length;
        const mealsConsumed = currentUserLogs.filter(log => MEAL_ITEMS.includes(log.itemName as MealItem)).length;
        return {
            user: user,
            allowances: {
                drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
                meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
            }
        };
    });

    return allowances;
}
