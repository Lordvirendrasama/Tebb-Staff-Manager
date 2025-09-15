
import type { User, ConsumptionLog, AttendanceLog, Employee, LeaveRequest, WeekDay } from './constants';
import { db } from './firebase';

const EMPLOYEES_COLLECTION = 'employees';
const CONSUMPTION_LOGS_COLLECTION = 'consumptionLogs';
const ATTENDANCE_LOGS_COLLECTION = 'attendanceLogs';
const LEAVE_REQUESTS_COLLECTION = 'leaveRequests';
const AWARDS_COLLECTION = 'awards';

// Helper to convert Firestore timestamps to Dates in documents
function docWithDates<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
    const data = doc.data() as any;
    if (!data) throw new Error("Document data is empty");

    const convertedData: any = { id: doc.id };
    for (const key in data) {
        const value = data[key];
        if (value instanceof Object && 'toDate' in value && typeof value.toDate === 'function') {
            convertedData[key] = value.toDate();
        } else {
            convertedData[key] = value;
        }
    }
    return convertedData as T;
}


// --- Consumption Logs ---
export const getConsumptionLogs = async (): Promise<ConsumptionLog[]> => {
    const snapshot = await db.collection(CONSUMPTION_LOGS_COLLECTION).get();
    return snapshot.docs.map(doc => docWithDates<ConsumptionLog>(doc));
};

export const addConsumptionLog = async (log: Omit<ConsumptionLog, 'id'>) => {
    await db.collection(CONSUMPTION_LOGS_COLLECTION).add(log);
};

// --- Attendance Logs ---
export const getAttendanceLogs = async (): Promise<AttendanceLog[]> => {
    const snapshot = await db.collection(ATTENDANCE_LOGS_COLLECTION).get();
    return snapshot.docs.map(doc => docWithDates<AttendanceLog>(doc));
};

export const addAttendanceLog = async (log: Omit<AttendanceLog, 'id'>) => {
    await db.collection(ATTENDANCE_LOGS_COLLECTION).add(log);
};

export const updateLatestAttendanceLogForUser = async (user: User, updates: Partial<AttendanceLog>) => {
    const query = db.collection(ATTENDANCE_LOGS_COLLECTION)
        .where('employeeName', '==', user)
        .orderBy('clockIn', 'desc')
        .limit(1);

    const snapshot = await query.get();
    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await db.collection(ATTENDANCE_LOGS_COLLECTION).doc(docId).update(updates);
    }
};

// --- Awards ---
export const getEmployeeOfTheWeek = async (): Promise<User | null> => {
    const doc = await db.collection(AWARDS_COLLECTION).doc('employeeOfTheWeek').get();
    if (doc.exists) {
        return doc.data()?.employeeName || null;
    }
    return null;
};

export const setEmployeeOfTheWeek = async (user: User | null) => {
    await db.collection(AWARDS_COLLECTION).doc('employeeOfTheWeek').set({ employeeName: user });
};

// --- Employees ---
export const getEmployees = async (): Promise<Employee[]> => {
    const snapshot = await db.collection(EMPLOYEES_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}

export const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    await db.collection(EMPLOYEES_COLLECTION).add(employee);
}

export const updateEmployee = async (employeeId: string, updates: Partial<Omit<Employee, 'id'>>) => {
    await db.collection(EMPLOYEES_COLLECTION).doc(employeeId).update(updates);
}

export const deleteEmployee = async (employeeId: string) => {
    const employeeRef = db.collection(EMPLOYEES_COLLECTION).doc(employeeId);
    const employeeDoc = await employeeRef.get();
    if (!employeeDoc.exists) return;

    const employeeName = employeeDoc.data()?.name;
    const batch = db.batch();

    // Delete employee
    batch.delete(employeeRef);

    // Delete associated data
    const collectionsToDelete = [
        CONSUMPTION_LOGS_COLLECTION,
        ATTENDANCE_LOGS_COLLECTION,
        LEAVE_REQUESTS_COLLECTION,
    ];

    for (const collectionName of collectionsToDelete) {
        const snapshot = await db.collection(collectionName).where('employeeName', '==', employeeName).get();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    // Check if the deleted employee was employee of the week
    const eow = await getEmployeeOfTheWeek();
    if (eow === employeeName) {
        await setEmployeeOfTheWeek(null);
    }
    
    await batch.commit();
}


// --- Leave Requests ---
export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const snapshot = await db.collection(LEAVE_REQUESTS_COLLECTION).get();
    return snapshot.docs.map(doc => docWithDates<LeaveRequest>(doc));
}

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id'>) => {
    await db.collection(LEAVE_REQUESTS_COLLECTION).add(request);
}

export const updateLeaveRequest = async (requestId: string, updates: Partial<Omit<LeaveRequest, 'id'>>) => {
    await db.collection(LEAVE_REQUESTS_COLLECTION).doc(requestId).update(updates);
}
