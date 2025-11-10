
'use server';

import type { User, WeekDay, ItemType, Employee } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { addDoc, collection, doc, updateDoc, deleteDoc, writeBatch, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { DEFAULT_EMPLOYEES } from '@/lib/constants';

// This function must be in a server-only file.
export async function getEmployeeOfTheWeek(): Promise<User | null> {
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

export async function getAllUsers(): Promise<Employee[]> {
    const snapshot = await getDocs(collection(db, 'employees'));
    const employees = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
    return employees.map(emp => {
        if (emp.payStartDate && typeof (emp.payStartDate as any)?.toDate === 'function') {
            emp.payStartDate = (emp.payStartDate as any).toDate().toISOString();
        }
        return emp;
    });
}


export async function setEmployeeOfTheWeekAction(employeeName: User | null) {
    try {
        await setEmployeeOfTheWeek(employeeName);
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, message: employeeName ? `${employeeName} is now Employee of the Week!` : 'Employee of the Week has been cleared.' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to set Employee of the Week: ${errorMessage}` };
    }
}

export async function addEmployeeAction(employeeData: Partial<Employee>) {
    try {
        await addDoc(collection(db, 'employees'), employeeData);
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Employee added successfully!' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to add employee: ${errorMessage}` };
    }
}

export async function updateEmployeeAction(id: string, employeeData: Partial<Employee>) {
    try {
        await updateDoc(doc(db, 'employees', id), employeeData);
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Employee updated successfully!' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to update employee: ${errorMessage}` };
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
            const collectionsToDelete = ['consumptionLogs', 'attendanceLogs', 'leaveRequests', 'payroll'];
            
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
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to remove employee: ${errorMessage}` };
    }
}

async function deleteCollection(collectionPath: string) {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

async function seedDefaultData() {
    const batch = writeBatch(db);

    // Seed employees
    const employeesCollection = collection(db, 'employees');
    DEFAULT_EMPLOYEES.forEach(employee => {
        const docRef = doc(employeesCollection);
        batch.set(docRef, employee);
    });

    // Seed consumable items
    const itemsCollection = collection(db, 'consumableItems');
    const defaultItems = [
        { name: 'Coffee', type: 'Drink' },
        { name: 'Cooler', type: 'Drink' },
        { name: 'Milkshake', type: 'Drink' },
        { name: 'Maggie', type: 'Meal' },
        { name: 'Fries', type: 'Meal' },
        { name: 'Pasta', type: 'Meal' },
    ];
    defaultItems.forEach(item => {
        const docRef = doc(itemsCollection);
        batch.set(docRef, item);
    });

    await batch.commit();
}


export async function resetDataAction() {
    try {
        // Clear existing data
        const collectionsToDelete = ['employees', 'consumptionLogs', 'attendanceLogs', 'leaveRequests', 'consumableItems', 'payroll'];
        for (const collectionPath of collectionsToDelete) {
            await deleteCollection(collectionPath);
        }
        await setDoc(doc(db, 'awards', 'employeeOfTheWeek'), { employeeName: null });

        // Seed new default data
        await seedDefaultData();

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, message: 'Application data has been reset and seeded with default values.' };
    } catch (error) {
        console.error('Data reset failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to reset data: ${errorMessage}` };
    }
}

export async function addItemAction(name: string, type: ItemType) {
    try {
        await addDoc(collection(db, 'consumableItems'), { name, type });
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true, message: 'Item added successfully!' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to add item: ${errorMessage}` };
    }
}

export async function updateItemAction(id: string, name: string, type: ItemType) {
    try {
        await updateDoc(doc(db, 'consumableItems', id), { name, type });
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true, message: 'Item updated successfully!' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to update item: ${errorMessage}` };
    }
}

export async function deleteItemAction(id: string) {
    try {
        await deleteDoc(doc(db, 'consumableItems', id));
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true, message: 'Item removed successfully!' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to remove item: ${errorMessage}` };
    }
}
