
import type { User } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';

async function getDb() {
    if (!adminDb) {
        console.error('Firebase Admin SDK is not initialized.');
        return null;
    }
    return adminDb;
}

const EMPLOYEE_OF_THE_WEEK_DOC_ID = 'current';

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    await db.collection('awards').doc(EMPLOYEE_OF_THE_WEEK_DOC_ID).set({ employeeName });
}

export async function getEmployeeOfTheWeek(): Promise<User | null> {
    const db = await getDb();
    if (!db) return null;

    try {
        const doc = await db.collection('awards').doc(EMPLOYEE_OF_THE_WEEK_DOC_ID).get();
        if (doc.exists) {
            return doc.data()?.employeeName || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching employee of the week:", error);
        return null;
    }
}
