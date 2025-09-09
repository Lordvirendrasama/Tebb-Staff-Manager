
import type { User, ConsumptionLog, AttendanceLog, LeaveRequest } from './constants';
import * as fs from 'fs';
import * as path from 'path';

// In-memory data store with a JSON file backup
interface Db {
    consumptionLogs: ConsumptionLog[];
    attendanceLogs: AttendanceLog[];
    leaveRequests: LeaveRequest[];
    employeeOfTheWeek: User | null;
}

const dbFilePath = path.join(process.cwd(), 'src', 'lib', 'db.json');

let db: Db;

function readDb(): Db {
    try {
        if (fs.existsSync(dbFilePath)) {
            const fileContent = fs.readFileSync(dbFilePath, 'utf-8');
            const parsedDb = JSON.parse(fileContent);

            // Revive date strings into Date objects
            parsedDb.consumptionLogs.forEach((log: ConsumptionLog) => {
                log.dateTimeLogged = new Date(log.dateTimeLogged);
            });
            parsedDb.attendanceLogs.forEach((log: AttendanceLog) => {
                log.clockIn = new Date(log.clockIn);
                if (log.clockOut) {
                    log.clockOut = new Date(log.clockOut);
                }
            });
            parsedDb.leaveRequests.forEach((req: LeaveRequest) => {
                req.leaveDate = new Date(req.leaveDate);
            });

            return parsedDb;
        }
    } catch (error) {
        console.error("Error reading db.json:", error);
    }
    // If file doesn't exist or is invalid, return default structure
    return {
        consumptionLogs: [],
        attendanceLogs: [],
        leaveRequests: [],
        employeeOfTheWeek: null
    };
}

function writeDb() {
    try {
        fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing to db.json:", error);
    }
}

// Initialize DB
db = readDb();


// --- Consumption Logs ---
export const getConsumptionLogs = () => {
    db = readDb();
    return db.consumptionLogs;
}
export const addConsumptionLog = (log: ConsumptionLog) => {
    db = readDb();
    db.consumptionLogs.unshift(log);
    writeDb();
};

// --- Attendance Logs ---
export const getAttendanceLogs = () => {
    db = readDb();
    return db.attendanceLogs;
}
export const addAttendanceLog = (log: AttendanceLog) => {
    db = readDb();
    db.attendanceLogs.unshift(log);
    writeDb();
};
export const updateLatestAttendanceLogForUser = (user: User, updates: Partial<AttendanceLog>) => {
    db = readDb();
    const logIndex = db.attendanceLogs.findIndex(l => l.employeeName === user && !l.clockOut);
    if (logIndex !== -1) {
        db.attendanceLogs[logIndex] = { ...db.attendanceLogs[logIndex], ...updates };
        writeDb();
    }
};

// --- Leave Requests ---
export const getLeaveRequests = () => {
    db = readDb();
    return db.leaveRequests;
}
export const addLeaveRequest = (request: LeaveRequest) => {
    db = readDb();
    db.leaveRequests.unshift(request);
    writeDb();
};


// --- Awards ---
export const getEmployeeOfTheWeek = () => {
    db = readDb();
    return db.employeeOfTheWeek;
}
export const setEmployeeOfTheWeek = (user: User) => {
    db = readDb();
    db.employeeOfTheWeek = user;
    writeDb();
};

