
import type { User, ConsumptionLog, AttendanceLog, Employee, LeaveRequest, WeekDay } from './constants';
import { db } from './firebase';

const getCollection = (collectionName: string) => db.collection(collectionName);

// Helper to convert Firestore timestamps to Dates in documents
function docWithDates<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
    const data = doc.data();

    const convertedData: any = { id: doc.id };
    if (data) {
        for (const key in data) {
            const value = data[key];
            if (value instanceof Object && 'toDate' in value && typeof value.toDate === 'function') {
                convertedData[key] = value.toDate();
            } else {
                convertedData[key] = value;
            }
        }
    }
    return convertedData as T;
}


// --- Consumption Logs ---
export const getConsumptionLogs = async (): Promise<ConsumptionLog[]> => {
    const snapshot = await getCollection('consumptionLogs').get();
    return snapshot.docs.map(doc => docWithDates<ConsumptionLog>(doc));
};

export const addConsumptionLog = async (log: Omit<ConsumptionLog, 'id'>) => {
    await getCollection('consumptionLogs').add(log);
};

// --- Attendance Logs ---
export const getAttendanceLogs = async (): Promise<AttendanceLog[]> => {
    const snapshot = await getCollection('attendanceLogs').get();
    return snapshot.docs.map(doc => docWithDates<AttendanceLog>(doc));
};

export const addAttendanceLog = async (log: Omit<AttendanceLog, 'id'>) => {
    await getCollection('attendanceLogs').add(log);
};

export const updateLatestAttendanceLogForUser = async (user: User, updates: Partial<AttendanceLog>) => {
    const query = getCollection('attendanceLogs')
        .where('employeeName', '==', user)
        .orderBy('clockIn', 'desc')
        .limit(1);

    const snapshot = await query.get();
    if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await getCollection('attendanceLogs').doc(docId).update(updates);
    }
};

// --- Awards ---
export const getEmployeeOfTheWeek = async (): Promise<User | null> => {
    const doc = await getCollection('awards').doc('employeeOfTheWeek').get();
    if (doc.exists) {
        return doc.data()?.employeeName ?? null;
    }
    return null;
};

export const setEmployeeOfTheWeek = async (user: User | null) => {
    await getCollection('awards').doc('employeeOfTheWeek').set({ employeeName: user });
};

// --- Employees ---
export const getEmployees = async (): Promise<Employee[]> => {
    const snapshot = await getCollection('employees').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}

export const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    await getCollection('employees').add(employee);
}

export const updateEmployee = async (employeeId: string, updates: Partial<Omit<Employee, 'id'>>) => {
    await getCollection('employees').doc(employeeId).update(updates);
}

export const deleteEmployee = async (employeeId: string) => {
    const employeeRef = getCollection('employees').doc(employeeId);
    const employeeDoc = await employeeRef.get();
    if (!employeeDoc.exists) return;

    const employeeName = employeeDoc.data()?.name;
    const batch = db.batch();

    // Delete employee
    batch.delete(employeeRef);

    // Delete associated data
    const collectionsToDelete = [
        'consumptionLogs',
        'attendanceLogs',
        'leaveRequests',
    ];

    for (const collectionName of collectionsToDelete) {
        const snapshot = await getCollection(collectionName).where('employeeName', '==', employeeName).get();
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
    const snapshot = await getCollection('leaveRequests').get();
    return snapshot.docs.map(doc => docWithDates<LeaveRequest>(doc));
}

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id'>) => {
    await getCollection('leaveRequests').add(request);
}

export const updateLeaveRequest = async (requestId: string, updates: Partial<Omit<LeaveRequest, 'id'>>) => {
    await getCollection('leaveRequests').doc(requestId).update(updates);
}
