
'use server';

import type { User, AttendanceStatus, AttendanceLog, Employee, LeaveRequest, LeaveType, WeekDay } from '@/lib/constants';
import * as data from '@/lib/data';
import { differenceInHours, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export async function getAttendanceStatus(user: User): Promise<AttendanceStatus> {
    const allLogs = await data.getAttendanceLogs();
    const latestLog = allLogs
        .filter(log => log.employeeName === user)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())[0];

    if (latestLog && !latestLog.clockOut) {
        return { status: 'Clocked In', clockInTime: latestLog.clockIn };
    }

    return { status: 'Clocked Out' };
}

export async function clockIn(user: User): Promise<void> {
    const now = new Date();
    const log: Omit<AttendanceLog, 'id'> = {
        employeeName: user,
        clockIn: now,
    };
    await data.addAttendanceLog(log);
}

export async function clockOut(user: User): Promise<void> {
    await data.updateLatestAttendanceLogForUser(user, { clockOut: new Date() });
}

export async function getAttendanceHistory(user: User): Promise<AttendanceLog[]> {
    const allLogs = await data.getAttendanceLogs();
    return allLogs
        .filter(log => log.employeeName === user)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
        .slice(0, 10);
}

export async function getMonthlyOvertime(): Promise<Array<{ name: User, overtime: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    const employees = await getEmployees();
    const employeeMap = new Map(employees.map(e => [e.name, e]));

    const attendanceLogs = (await data.getAttendanceLogs()).filter(log => 
        log.clockOut && 
        new Date(log.clockIn) >= monthStart
    );

    const overtimeByUser: Record<User, number> = employees.reduce((acc, emp) => {
        acc[emp.name] = 0;
        return acc;
    }, {} as Record<User, number>);

    attendanceLogs.forEach(log => {
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

// --- Employee Service Functions ---
export async function getEmployees(): Promise<Employee[]> {
    return data.getEmployees();
}

export async function addEmployee(name: string, weeklyOffDay: WeekDay, standardWorkHours: number): Promise<void> {
    const newEmployee: Omit<Employee, 'id'> = {
        name,
        weeklyOffDay,
        standardWorkHours,
    };
    await data.addEmployee(newEmployee);
}

export async function updateEmployee(id: string, name: string, weeklyOffDay: WeekDay, standardWorkHours: number): Promise<void> {
    await data.updateEmployee(id, { name, weeklyOffDay, standardWorkHours });
}

export async function deleteEmployee(id: string): Promise<void> {
    await data.deleteEmployee(id);
}


// --- Leave Request Service Functions ---
export async function requestLeave(user: User, startDate: Date, endDate: Date, reason: string, leaveType: LeaveType): Promise<void> {
    const newRequest: Omit<LeaveRequest, 'id'> = {
        employeeName: user,
        startDate,
        endDate,
        reason,
        leaveType,
        status: 'Pending',
    };
    await data.addLeaveRequest(newRequest);
}

export async function getLeaveRequestsForUser(user: User): Promise<LeaveRequest[]> {
    const allRequests = await data.getLeaveRequests();
    return allRequests
        .filter(req => req.employeeName === user)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const allRequests = await data.getLeaveRequests();
    return allRequests
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function approveLeave(requestId: string): Promise<void> {
    await data.updateLeaveRequest(requestId, { status: 'Approved' });
}

export async function denyLeave(requestId: string): Promise<void> {
    await data.updateLeaveRequest(requestId, { status: 'Denied' });
}

export async function updateLeaveType(requestId: string, leaveType: LeaveType): Promise<void> {
    await data.updateLeaveRequest(requestId, { leaveType });
}

export async function getMonthlyLeaves(): Promise<Array<{ name: User; leaveDays: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const employees = await getEmployees();
    const employeeMap = new Map(employees.map(e => [e.name, e]));
    
    const leaveRequests = (await data.getLeaveRequests()).filter(req => 
        req.status === 'Approved' && 
        new Date(req.startDate) <= monthEnd && 
        new Date(req.endDate) >= monthStart
    );

    const leaveDaysByUser: Record<User, number> = employees.reduce((acc, emp) => {
        acc[emp.name] = 0;
        return acc;
    }, {} as Record<User, number>);

    const getWeekDayNumber = (day: WeekDay): number => {
        const dayMap: Record<WeekDay, number> = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
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
            
            const workDays = daysInInterval.filter(day => {
                const dayOfWeek = day.getDay();
                // Check if it's not the weekly off day
                const isWorkDay = dayOfWeek !== offDayNumber;
                return isWorkDay;
            }).length;

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
