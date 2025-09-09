
'use server';

import type { User, AttendanceStatus, AttendanceLog, LeaveRequest } from '@/lib/constants';
import * as data from '@/lib/data';
import { startOfDay } from 'date-fns';

export async function getAttendanceStatus(user: User): Promise<AttendanceStatus> {
    const allLogs = await data.getAttendanceLogs();
    const latestLog = allLogs
        .filter(log => log.employeeName === user)
        .sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime())[0];

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
    await data.addAttendanceLog(log);
}

export async function clockOut(user: User): Promise<void> {
    await data.updateLatestAttendanceLogForUser(user, { clockOut: new Date() });
}

export async function getAttendanceHistory(user: User): Promise<AttendanceLog[]> {
    const allLogs = await data.getAttendanceLogs();
    return allLogs
        .filter(log => log.employeeName === user)
        .sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime())
        .slice(0, 10);
}

export async function requestLeave(user: User, leaveDate: Date, reason: string): Promise<void> {
    const request: LeaveRequest = {
        employeeName: user,
        leaveDate,
        reason,
        status: 'Pending',
    };
    await data.addLeaveRequest(request);
}

export async function getLeaveRequests(user: User): Promise<LeaveRequest[]> {
    const allRequests = await data.getLeaveRequests();
    return allRequests
        .filter(req => req.employeeName === user)
        .sort((a, b) => b.leaveDate.getTime() - a.leaveDate.getTime())
        .slice(0, 10);
}
