
'use server';

import type { User, WeekDay } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { setEmployeeOfTheWeek } from '@/services/awards-service';
import { addEmployee, updateEmployee, deleteEmployee } from '@/services/attendance-service';

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
        await addEmployee(name, weeklyOffDay, standardWorkHours);
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
        await updateEmployee(id, name, weeklyOffDay, standardWorkHours);
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
