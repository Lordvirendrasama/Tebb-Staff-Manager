
import type { User, ConsumptionLog, AttendanceLog, LeaveRequest } from './constants';
import { USERS } from './constants';

// In-memory data store
interface Db {
    consumptionLogs: ConsumptionLog[];
    attendanceLogs: AttendanceLog[];
    leaveRequests: LeaveRequest[];
    employeeOfTheWeek: User | null;
}

const db: Db = {
    consumptionLogs: [],
    attendanceLogs: [],
    leaveRequests: [],
    employeeOfTheWeek: null
};

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
    const logIndex = db.attendanceLogs.findIndex(l => l.employeeName === user);
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

// --- Seed initial data ---
function seedData() {
    if (db.consumptionLogs.length > 0) return; // Don't re-seed

    console.log("Seeding initial data...");

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    db.consumptionLogs.push(
        { employeeName: 'Abbas', itemName: 'Coffee', dateTimeLogged: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        { employeeName: 'Musaib', itemName: 'Pasta', dateTimeLogged: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
        { employeeName: 'Abbas', itemName: 'Fries', dateTimeLogged: new Date(yesterday.getTime() - 3 * 60 * 60 * 1000) }
    );

    db.attendanceLogs.push(
        { employeeName: 'Abbas', clockIn: new Date(now.setHours(9, 0, 0, 0)), clockOut: new Date(now.setHours(17, 5, 0, 0))},
        { employeeName: 'Musaib', clockIn: new Date(now.setHours(8, 55, 0, 0)) },
        { employeeName: 'Abbas', clockIn: new Date(yesterday.setHours(9, 3, 0, 0)), clockOut: new Date(yesterday.setHours(17, 2, 0, 0))}
    );

    db.leaveRequests.push(
        { employeeName: 'Musaib', leaveDate: new Date('2024-08-10'), reason: 'Family event', status: 'Approved' },
        { employeeName: 'Abbas', leaveDate: new Date('2024-08-15'), reason: 'Appointment', status: 'Pending' }
    );

    db.employeeOfTheWeek = 'Musaib';
}

seedData();
