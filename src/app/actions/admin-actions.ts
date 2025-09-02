'use server';

import type { User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { setEmployeeOfTheWeek } from '@/services/awards-service';

export async function setEmployeeOfTheWeekAction(employeeName: User) {
    try {
        await setEmployeeOfTheWeek(employeeName);
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, message: `${employeeName} is now Employee of the Week!` };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'Failed to set Employee of the Week.' };
    }
}
