
'use server';

import type { User, AttendanceStatus, AttendanceLog, LeaveRequest, LeaveType, Employee } from '@/lib/constants';
import * as data from '@/lib/data';
import { differenceInHours, startOfMonth, endOfMonth, startOfDay, differenceInDays, eachDayOfInterval } from 'date-fns';

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

export async function requestLeave(user: User, startDate: Date, endDate: Date, reason: string, leaveType: LeaveType): Promise<void> {
    const request: LeaveRequest = {
        id: new Date().toISOString() + Math.random().toString(36).substring(2, 9), // simple unique id
        employeeName: user,
        startDate: startOfDay(startDate),
        endDate: startOfDay(endDate),
        reason,
        leaveType,
        status: 'Pending',
    };
    data.addLeaveRequest(request);
}

export async function getLeaveRequestsForUser(user: User): Promise<LeaveRequest[]> {
    const allRequests = data.getLeaveRequests();
    return allRequests
        .filter(req => req.employeeName === user)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 10);
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return data.getAllLeaveRequests().sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function approveLeaveRequest(id: string): Promise<void> {
    data.updateLeaveRequestStatus(id, 'Approved');
}

export async function denyLeaveRequest(id: string): Promise<void> {
    data.updateLeaveRequestStatus(id, 'Denied');
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

export async function getMonthlyLeaves(): Promise<Array<{ name: User; leaves: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const employees = await getEmployees();
    const approvedLeaveRequests = data.getLeaveRequests().filter(req => req.status === 'Approved');

    const leavesByUser: Record<User, number> = employees.reduce((acc, emp) => {
        acc[emp.name] = 0;
        return acc;
    }, {} as Record<User, number>);

    approvedLeaveRequests.forEach(req => {
        const leaveInterval = { start: new Date(req.startDate), end: new Date(req.endDate) };
        const daysInLeave = eachDayOfInterval(leaveInterval);
        
        daysInLeave.forEach(day => {
            if (day >= monthStart && day <= monthEnd) {
                if (leavesByUser[req.employeeName] !== undefined) {
                    leavesByUser[req.employeeName]++;
                }
            }
        });
    });

    return employees.map(emp => ({ name: emp.name, leaves: leavesByUser[emp.name] || 0 }));
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
