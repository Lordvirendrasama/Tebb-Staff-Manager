
'use server';

import type { User, WeekDay } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { addDoc, collection, doc, updateDoc, deleteDoc, writeBatch, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { DEFAULT_EMPLOYEES } from '@/lib/constants';

// This function must be in a server-only file.
async function getEmployeeOfTheWeek(): Promise<User | null> {
    const docSnap = await getDoc(doc(db, 'awards', 'employeeOfTheWeek'));
    if (docSnap.exists()) {
        return docSnap.data()?.employeeName ?? null;
    }
    return null;
}

async function setEmployeeOfTheWeek(employeeName: User | null): Promise<void> {
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const employeeNames = employeesSnapshot.docs.map(d => d.data().name);

    if (employeeName && !employeeNames.includes(employeeName)) {
        throw new Error("Employee not found");
    }
    
    await setDoc(doc(db, 'awards', 'employeeOfTheWeek'), { employeeName: employeeName });
}


export async function setEmployeeOfTheWeekAction(employeeName: User | null) {
    try {
        await setEmployeeOfTheWeek(employeeName);
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, message: employeeName ? `${employeeName} is now Employee of the Week!` : 'Employee of the Week has been cleared.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to set Employee of the Week.' };
    }
}

export async function addEmployeeAction(name: string, weeklyOffDay: WeekDay, standardWorkHours: number) {
    try {
        await addDoc(collection(db, 'employees'), {name, weeklyOffDay, standardWorkHours});
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Employee added successfully!' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to add employee.' };
    }
}

export async function updateEmployeeAction(id: string, name: string, weeklyOffDay: WeekDay, standardWorkHours: number) {
    try {
        await updateDoc(doc(db, 'employees', id), { name, weeklyOffDay, standardWorkHours });
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Employee updated successfully!' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to update employee.' };
    }
}

export async function deleteEmployeeAction(id: string) {
    try {
        const employeeRef = doc(db, 'employees', id);
        const employeeDoc = await getDoc(employeeRef);
        if (!employeeDoc.exists()) return { success: false, message: 'Employee not found.'};

        const employeeName = employeeDoc.data()?.name;
        
        await deleteDoc(employeeRef);

        if (employeeName) {
            const batch = writeBatch(db);
            const collectionsToDelete = ['consumptionLogs', 'attendanceLogs', 'leaveRequests'];
            
            for (const collectionName of collectionsToDelete) {
                const q = query(collection(db, collectionName), where('employeeName', '==', employeeName));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    snapshot.docs.forEach(doc => batch.delete(doc.ref));
                }
            }
            await batch.commit();

            const eow = await getEmployeeOfTheWeek();
            if (eow === employeeName) {
                await setEmployeeOfTheWeek(null);
            }
        }
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Employee removed successfully!' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to remove employee.' };
    }
}

export async function seedDatabaseAction() {
    try {
        console.log('Seeding database...');
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        
        if (employeesSnapshot.empty) {
            console.log('No employees found. Seeding default employees...');
            for (const emp of DEFAULT_EMPLOYEES) {
                await addDoc(collection(db, 'employees'), emp);
            }
            console.log('Default employees seeded.');

            await setEmployeeOfTheWeek(DEFAULT_EMPLOYEES[0].name);
            console.log('Default employee of the week set.');
        } else {
            console.log('Employees already exist. Skipping seeding.');
        }
        console.log('Database seeding process complete.');
        
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Database seeded successfully!' };
    } catch (error) {
        console.error('Seeding failed:', error);
        return { success: false, message: 'Failed to seed database.' };
    }
}

export { getEmployeeOfTheWeek };
