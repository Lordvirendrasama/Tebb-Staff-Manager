
'use server';

import type { User, AttendanceStatus, AttendanceLog, Employee, LeaveRequest, LeaveType } from '@/lib/constants';
import * as data from '@/lib/data';
import { differenceInHours, startOfMonth, endOfMonth, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';

export async function getAttendanceStatus(user: User): Promise<AttendanceStatus> {
    const allLogs = data.getAttendanceLogs();
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
    const log: AttendanceLog = {
        employeeName: user,
        clockIn: now,
    };
    data.addAttendanceLog(log);
}

export async function clockOut(user: User): Promise<void> {
    data.updateLatestAttendanceLogForUser(user, { clockOut: new Date() });
}

export async function getAttendanceHistory(user: User): Promise<AttendanceLog[]> {
    const allLogs = data.getAttendanceLogs();
    return allLogs
        .filter(log => log.employeeName === user)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
        .slice(0, 10);
}

export async function getMonthlyOvertime(): Promise<Array<{ name: User, overtime: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const employees = await getEmployees();
    const employeeMap = new Map(employees.map(e => [e.name, e]));

    const attendanceLogs = data.getAttendanceLogs().filter(log => 
        log.clockOut && 
        new Date(log.clockIn) >= monthStart && 
        new Date(log.clockIn) <= monthEnd
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

export async function addEmployee(name: string, weeklyOffDay: string, standardWorkHours: number): Promise<void> {
    const newEmployee: Employee = {
        id: new Date().toISOString() + Math.random().toString(36).substring(2, 9),
        name,
        weeklyOffDay: weeklyOffDay as any,
        standardWorkHours,
    };
    data.addEmployee(newEmployee);
}

export async function updateEmployee(id: string, name: string, weeklyOffDay: string, standardWorkHours: number): Promise<void> {
    data.updateEmployee(id, { name, weeklyOffDay: weeklyOffDay as any, standardWorkHours });
}

export async function deleteEmployee(id: string): Promise<void> {
    data.deleteEmployee(id);
}


// --- Leave Request Service Functions ---
export async function requestLeave(user: User, startDate: Date, endDate: Date, reason: string, leaveType: LeaveType): Promise<void> {
    const newRequest: LeaveRequest = {
        id: new Date().toISOString() + Math.random().toString(36).substring(2, 9),
        employeeName: user,
        startDate,
        endDate,
        reason,
        leaveType,
        status: 'Pending',
    };
    data.addLeaveRequest(newRequest);
}

export async function getLeaveRequestsForUser(user: User): Promise<LeaveRequest[]> {
    return data.getLeaveRequests()
        .filter(req => req.employeeName === user)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return data.getLeaveRequests()
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function approveLeave(requestId: string): Promise<void> {
    data.updateLeaveRequest(requestId, { status: 'Approved' });
}

export async function denyLeave(requestId: string): Promise<void> {
    data.updateLeaveRequest(requestId, { status: 'Denied' });
}

export async function getMonthlyLeaves(): Promise<Array<{ name: User; leaveDays: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const employees = await getEmployees();
    const leaveRequests = data.getLeaveRequests().filter(req => 
        req.status === 'Approved' && 
        new Date(req.startDate) <= monthEnd && 
        new Date(req.endDate) >= monthStart
    );

    const leaveDaysByUser: Record<User, number> = employees.reduce((acc, emp) => {
        acc[emp.name] = 0;
        return acc;
    }, {} as Record<User, number>);

    leaveRequests.forEach(req => {
        const interval = {
            start: new Date(req.startDate) < monthStart ? monthStart : new Date(req.startDate),
            end: new Date(req.endDate) > monthEnd ? monthEnd : new Date(req.endDate)
        };
        const employee = employees.find(e => e.name === req.employeeName);
        if (employee) {
            const daysInInterval = eachDayOfInterval(interval);
            const workDays = daysInInterval.filter(day => day.getDay() !== (new Date(0).getDay() + (employee.weeklyOffDay as any))).length;
            leaveDaysByUser[req.employeeName] += workDays;
        }
    });
    
    return employees.map(emp => ({ name: emp.name, leaveDays: leaveDaysByUser[emp.name] || 0 }));
}
