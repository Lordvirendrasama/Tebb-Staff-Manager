
'use server';

import type { User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { setEmployeeOfTheWeek } from '@/services/awards-service';
import { addEmployee, updateEmployee } from '@/services/attendance-service';

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

export async function addEmployeeAction(name: string, weeklyOffDay: string) {
    try {
        await addEmployee(name, weeklyOffDay);
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Employee added successfully!' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to add employee.' };
    }
}

export async function updateEmployeeAction(id: string, name: string, weeklyOffDay: string) {
    try {
        await updateEmployee(id, name, weeklyOffDay);
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Employee updated successfully!' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to update employee.' };
    }
}
