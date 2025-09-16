
'use server';

import type { User, WeekDay } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { addEmployee, updateEmployee, deleteEmployee } from '@/services/attendance-service';
import { seedDatabase } from '@/lib/seed';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { getEmployees } from '@/services/attendance-service';

async function setEmployeeOfTheWeek(employeeName: User | null): Promise<void> {
    if (employeeName) {
        const employees = await getEmployees();
        const employeeNames = employees.map(e => e.name);
        if (employeeNames.includes(employeeName)) {
            await setDoc(doc(db, 'awards', 'employeeOfTheWeek'), { employeeName: employeeName });
        } else {
            throw new Error("Employee not found");
        }
    } else {
        await setDoc(doc(db, 'awards', 'employeeOfTheWeek'), { employeeName: null });
    }
}


export async function setEmployeeOfTheWeekAction(employeeName: User) {
    try {
        await setEmployeeOfTheWeek(employeeName);
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, message: `${employeeName} is now Employee of the Week!` };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to set Employee of the Week.' };
    }
}

export async function addEmployeeAction(name: string, weeklyOffDay: WeekDay, standardWorkHours: number) {
    try {
        await addEmployee({name, weeklyOffDay, standardWorkHours});
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
        await updateEmployee(id, { name, weeklyOffDay, standardWorkHours });
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
        await deleteEmployee(id);
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
        await seedDatabase();
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Database seeded successfully!' };
    } catch (error) {
        console.error('Seeding failed:', error);
        return { success: false, message: 'Failed to seed database.' };
    }
}
