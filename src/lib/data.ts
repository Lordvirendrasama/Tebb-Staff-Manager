
import type { User, ConsumptionLog, AttendanceLog, LeaveRequest } from './constants';
import { USERS } from './constants';

// In-memory data store
interface Db {
    consumptionLogs: ConsumptionLog[];
    attendanceLogs: AttendanceLog[];
    leaveRequests: LeaveRequest[];
    employeeOfTheWeek: User | null;
}

let db: Db = {
    consumptionLogs: [],
    attendanceLogs: [],
    leaveRequests: [],
    employeeOfTheWeek: null
};

function resetData() {
    console.log("Resetting data...");
    db = {
        consumptionLogs: [],
        attendanceLogs: [],
        leaveRequests: [],
        employeeOfTheWeek: 'Abbas' // Default to Abbas
    };

    const now = new Date();
    // Seed some example data for today
    db.attendanceLogs.push(
        { employeeName: 'Abbas', clockIn: new Date(new Date(now).setHours(9, 5, 0, 0))},
        { employeeName: 'Musaib', clockIn: new Date(new Date(now).setHours(10, 15, 0, 0)), clockOut: new Date(new Date(now).setHours(14, 30, 0, 0)) }
    );
     db.consumptionLogs.push(
        { employeeName: 'Musaib', itemName: 'Coffee', dateTimeLogged: new Date(new Date(now).setHours(10, 20, 0, 0)) }
    );
     db.leaveRequests.push(
        { employeeName: 'Musaib', leaveDate: new Date('2024-08-20'), reason: 'Dentist Appointment', status: 'Approved' }
    );
}


// --- Consumption Logs ---
export const getConsumptionLogs = () => db.consumptionLogs;
export const addConsumptionLog = (log: ConsumptionLog) => {
    db.consumptionLogs.unshift(log);
};

// --- Attendance Logs ---
export const getAttendanceLogs = () => db.attendanceLogs;
export const addAttendanceLog = (log: AttendanceLog) => {
    db.attendanceLogs.unshift(log);
};
export const updateLatestAttendanceLogForUser = (user: User, updates: Partial<AttendanceLog>) => {
    // find the most recent log for that user that doesn't have a clockOut
    const logIndex = db.attendanceLogs.findIndex(l => l.employeeName === user && !l.clockOut);
    if (logIndex !== -1) {
        db.attendanceLogs[logIndex] = { ...db.attendanceLogs[logIndex], ...updates };
    }
};

// --- Leave Requests ---
export const getLeaveRequests = () => db.leaveRequests;
export const addLeaveRequest = (request: LeaveRequest) => {
    db.leaveRequests.unshift(request);
};


// --- Awards ---
export const getEmployeeOfTheWeek = () => db.employeeOfTheWeek;
export const setEmployeeOfTheWeek = (user: User) => {
    db.employeeOfTheWeek = user;
};


resetData();
