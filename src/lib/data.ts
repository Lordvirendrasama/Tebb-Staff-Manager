
import type { User, ConsumptionLog, AttendanceLog, LeaveRequest } from './constants';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'db.json');

export interface Database {
  consumptionLogs: ConsumptionLog[];
  attendanceLogs: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  employeeOfTheWeek: User | null;
}

export function readDb(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);
    // Dates are stored as ISO strings in JSON, so we need to convert them back to Date objects
    return {
        ...db,
        consumptionLogs: db.consumptionLogs.map((log: any) => ({ ...log, dateTimeLogged: new Date(log.dateTimeLogged) })),
        attendanceLogs: db.attendanceLogs.map((log: any) => ({ ...log, clockIn: new Date(log.clockIn), clockOut: log.clockOut ? new Date(log.clockOut) : undefined })),
        leaveRequests: db.leaveRequests.map((req: any) => ({ ...req, leaveDate: new Date(req.leaveDate) }))
    };
  } catch (error) {
    // If the file doesn't exist or is empty, return a default structure
    return { consumptionLogs: [], attendanceLogs: [], leaveRequests: [], employeeOfTheWeek: null };
  }
}

export function writeDb(db: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}


// --- Consumption Logs ---
export const getConsumptionLogs = (): ConsumptionLog[] => {
    return readDb().consumptionLogs;
};

export const addConsumptionLog = (log: ConsumptionLog) => {
    const db = readDb();
    db.consumptionLogs.push(log);
    writeDb(db);
};

// --- Attendance Logs ---
export const getAttendanceLogs = (): AttendanceLog[] => {
    return readDb().attendanceLogs;
};

export const addAttendanceLog = (log: AttendanceLog) => {
    const db = readDb();
    db.attendanceLogs.push(log);
    writeDb(db);
};

export const updateLatestAttendanceLogForUser = (user: User, updates: Partial<AttendanceLog>) => {
    const db = readDb();
    const logsForUser = db.attendanceLogs
        .filter(log => log.employeeName === user)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
    
    if (logsForUser.length > 0) {
        const latestLog = logsForUser[0];
        const logIndex = db.attendanceLogs.findIndex(log => log.clockIn.getTime() === latestLog.clockIn.getTime() && log.employeeName === user);

        if (logIndex !== -1) {
            db.attendanceLogs[logIndex] = { ...db.attendanceLogs[logIndex], ...updates };
            writeDb(db);
        }
    }
};

// --- Leave Requests ---
export const getLeaveRequests = (): LeaveRequest[] => {
    return readDb().leaveRequests;
};

export const getAllLeaveRequests = (): LeaveRequest[] => {
    return readDb().leaveRequests;
};

export const addLeaveRequest = (request: LeaveRequest) => {
    const db = readDb();
    db.leaveRequests.push(request);
    writeDb(db);
};

export const updateLeaveRequestStatus = (id: string, status: 'Approved' | 'Denied') => {
    const db = readDb();
    const requestIndex = db.leaveRequests.findIndex(req => req.id === id);
    if (requestIndex !== -1) {
        db.leaveRequests[requestIndex].status = status;
        writeDb(db);
    }
};


// --- Awards ---
export const getEmployeeOfTheWeek = (): User | null => {
    return readDb().employeeOfTheWeek;
};

export const setEmployeeOfTheWeek = (user: User | null) => {
    const db = readDb();
    db.employeeOfTheWeek = user;
    writeDb(db);
};

// --- Data Export ---
export async function getAllData() {
    const db = readDb();
    return {
        consumptionLogs: db.consumptionLogs,
        attendanceLogs: db.attendanceLogs,
        leaveRequests: db.leaveRequests,
        employeeOfTheWeek: db.employeeOfTheWeek,
    };
}
