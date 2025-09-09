
import type { User, ConsumptionLog, AttendanceLog, LeaveRequest } from './constants';
import { getDb } from './firebase';

const CONSUMPTION_COLLECTION = 'consumptionLogs';
const ATTENDANCE_COLLECTION = 'attendanceLogs';
const LEAVE_COLLECTION = 'leaveRequests';
const AWARDS_COLLECTION = 'awards';

function docToConsumptionLog(doc: FirebaseFirestore.DocumentSnapshot): ConsumptionLog {
    const data = doc.data()!;
    return {
        employeeName: data.employeeName,
        itemName: data.itemName,
        dateTimeLogged: data.dateTimeLogged.toDate(),
    };
}

function docToAttendanceLog(doc: FirebaseFirestore.DocumentSnapshot): AttendanceLog {
    const data = doc.data()!;
    return {
        employeeName: data.employeeName,
        clockIn: data.clockIn.toDate(),
        clockOut: data.clockOut ? data.clockOut.toDate() : undefined,
    };
}

function docToLeaveRequest(doc: FirebaseFirestore.DocumentSnapshot): LeaveRequest {
    const data = doc.data()!;
    return {
        employeeName: data.employeeName,
        leaveDate: data.leaveDate.toDate(),
        reason: data.reason,
        status: data.status,
    };
}


// --- Consumption Logs ---
export const getConsumptionLogs = async (): Promise<ConsumptionLog[]> => {
    const db = getDb();
    const snapshot = await db.collection(CONSUMPTION_COLLECTION).get();
    return snapshot.docs.map(docToConsumptionLog);
};

export const addConsumptionLog = async (log: ConsumptionLog) => {
    const db = getDb();
    await db.collection(CONSUMPTION_COLLECTION).add(log);
};

// --- Attendance Logs ---
export const getAttendanceLogs = async (): Promise<AttendanceLog[]> => {
    const db = getDb();
    const snapshot = await db.collection(ATTENDANCE_COLLECTION).get();
    return snapshot.docs.map(docToAttendanceLog);
};

export const addAttendanceLog = async (log: AttendanceLog) => {
    const db = getDb();
    await db.collection(ATTENDANCE_COLLECTION).add(log);
};

export const updateLatestAttendanceLogForUser = async (user: User, updates: Partial<AttendanceLog>) => {
    const db = getDb();
    const snapshot = await db.collection(ATTENDANCE_COLLECTION)
        .where('employeeName', '==', user)
        .orderBy('clockIn', 'desc')
        .limit(1)
        .get();

    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await db.collection(ATTENDANCE_COLLECTION).doc(docId).update(updates);
    }
};

// --- Leave Requests ---
export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const db = getDb();
    const snapshot = await db.collection(LEAVE_COLLECTION).get();
    return snapshot.docs.map(docToLeaveRequest);
};

export const addLeaveRequest = async (request: LeaveRequest) => {
    const db = getDb();
    await db.collection(LEAVE_COLLECTION).add(request);
};


// --- Awards ---
export const getEmployeeOfTheWeek = async (): Promise<User | null> => {
    const db = getDb();
    const doc = await db.collection(AWARDS_COLLECTION).doc('employeeOfTheWeek').get();
    if (doc.exists) {
        return doc.data()!.employeeName;
    }
    return null;
};

export const setEmployeeOfTheWeek = async (user: User | null) => {
    const db = getDb();
    await db.collection(AWARDS_COLLECTION).doc('employeeOfTheWeek').set({ employeeName: user });
};

// --- Data Export ---
export async function getAllData() {
    const consumptionLogs = await getConsumptionLogs();
    const attendanceLogs = await getAttendanceLogs();
    const leaveRequests = await getLeaveRequests();
    const employeeOfTheWeek = await getEmployeeOfTheWeek();
    return { consumptionLogs, attendanceLogs, leaveRequests, employeeOfTheWeek };
}
