
'use server';

import type { User, AttendanceStatus, AttendanceLog, LeaveRequest, LeaveType, LeaveStatus } from '@/lib/constants';
import * as data from '@/lib/data';
import { startOfDay } from 'date-fns';

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

export async function requestLeave(user: User, leaveDate: Date, reason: string, leaveType: LeaveType): Promise<void> {
    const request: LeaveRequest = {
        id: new Date().toISOString() + Math.random().toString(36).substring(2, 9), // simple unique id
        employeeName: user,
        leaveDate,
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
        .sort((a, b) => new Date(b.leaveDate).getTime() - new Date(a.leaveDate).getTime())
        .slice(0, 10);
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return data.getAllLeaveRequests().sort((a,b) => new Date(b.leaveDate).getTime() - new Date(a.leaveDate).getTime());
}

export async function approveLeaveRequest(id: string): Promise<void> {
    data.updateLeaveRequestStatus(id, 'Approved');
}

export async function denyLeaveRequest(id: string): Promise<void> {
    data.updateLeaveRequestStatus(id, 'Denied');
}
