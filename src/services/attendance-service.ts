
'use server';

import type { User, AttendanceLog, AttendanceStatus, LeaveRequest } from '@/lib/constants';

// In-memory store for attendance logs
const globalForAttendance = globalThis as unknown as {
  attendanceLogs: AttendanceLog[] | undefined;
  leaveRequests: LeaveRequest[] | undefined;
};

const attendanceLogs: AttendanceLog[] = globalForAttendance.attendanceLogs ?? [];
if (process.env.NODE_ENV !== 'production') globalForAttendance.attendanceLogs = attendanceLogs;

const leaveRequests: LeaveRequest[] = globalForAttendance.leaveRequests ?? [];
if (process.env.NODE_ENV !== 'production') globalForAttendance.leaveRequests = leaveRequests;


export async function clockIn(employeeName: User): Promise<AttendanceLog> {
  const existingEntry = attendanceLogs.find(
    log => log.employeeName === employeeName && !log.clockOut
  );
  if (existingEntry) {
    throw new Error('You are already clocked in.');
  }
  const newLog: AttendanceLog = {
    employeeName,
    clockIn: new Date(),
  };
  attendanceLogs.push(newLog);
  return newLog;
}

export async function clockOut(employeeName: User): Promise<AttendanceLog> {
  const logToUpdate = attendanceLogs.find(
    log => log.employeeName === employeeName && !log.clockOut
  );
  if (!logToUpdate) {
    throw new Error('You are not clocked in.');
  }
  logToUpdate.clockOut = new Date();
  return logToUpdate;
}

export async function getAttendanceStatus(employeeName: User): Promise<AttendanceStatus> {
    const lastLog = attendanceLogs
      .filter(log => log.employeeName === employeeName)
      .sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime())[0];
  
    if (lastLog && !lastLog.clockOut) {
      return { status: 'Clocked In', clockInTime: lastLog.clockIn };
    }
  
    return { status: 'Clocked Out' };
}
  
export async function getAttendanceHistory(employeeName: User): Promise<AttendanceLog[]> {
    return attendanceLogs
        .filter(log => log.employeeName === employeeName)
        .sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
}

export async function getAllAttendanceLogs(): Promise<AttendanceLog[]> {
    return attendanceLogs.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
}

export async function requestLeave(employeeName: User, leaveDate: Date, reason: string): Promise<LeaveRequest> {
    const newRequest: LeaveRequest = {
        employeeName,
        leaveDate,
        reason,
        status: 'Pending',
    };
    leaveRequests.push(newRequest);
    return newRequest;
}

export async function getLeaveRequests(employeeName: User): Promise<LeaveRequest[]> {
    return leaveRequests
        .filter(req => req.employeeName === employeeName)
        .sort((a,b) => b.leaveDate.getTime() - a.leaveDate.getTime());
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return leaveRequests.sort((a,b) => b.leaveDate.getTime() - a.leaveDate.getTime());
}
