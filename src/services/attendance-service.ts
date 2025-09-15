
'use server';

import type { User, AttendanceStatus, AttendanceLog, LeaveRequest, LeaveType, LeaveStatus } from '@/lib/constants';
import * as data from '@/lib/data';
import { ANNUAL_LEAVE_ALLOWANCE, STANDARD_WORK_HOURS, USERS } from '@/lib/constants';
import { differenceInCalendarDays, differenceInHours, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';

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
        startDate,
        endDate,
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

export async function getLeaveBalances(): Promise<Array<{ user: User, remainingDays: number }>> {
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    
    const allRequests = data.getLeaveRequests();
    const approvedRequests = allRequests.filter(req => 
        req.status === 'Approved' && 
        req.leaveType === 'Paid (Made Up)' &&
        new Date(req.startDate) >= yearStart &&
        new Date(req.endDate) <= yearEnd
    );

    const balances = USERS.map(user => {
        const userRequests = approvedRequests.filter(req => req.employeeName === user);
        const daysTaken = userRequests.reduce((acc, req) => {
            const days = differenceInCalendarDays(new Date(req.endDate), new Date(req.startDate)) + 1;
            return acc + days;
        }, 0);
        return {
            user,
            remainingDays: ANNUAL_LEAVE_ALLOWANCE - daysTaken
        };
    });

    return balances;
}

export async function getMonthlyOvertime(): Promise<Array<{ name: User, overtime: number }>> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const attendanceLogs = data.getAttendanceLogs().filter(log => 
        log.clockOut && 
        new Date(log.clockIn) >= monthStart && 
        new Date(log.clockIn) <= monthEnd
    );

    const overtimeByUser: Record<User, number> = {
        'Abbas': 0,
        'Musaib': 0,
    };

    attendanceLogs.forEach(log => {
        if (log.clockOut) {
            const hoursWorked = differenceInHours(new Date(log.clockOut), new Date(log.clockIn));
            const overtime = Math.max(0, hoursWorked - STANDARD_WORK_HOURS);
            if (overtimeByUser[log.employeeName] !== undefined) {
                overtimeByUser[log.employeeName] += overtime;
            }
        }
    });

    return USERS.map(user => ({ name: user, overtime: overtimeByUser[user] }));
}
