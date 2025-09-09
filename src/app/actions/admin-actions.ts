
'use server';

import type { User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function setEmployeeOfTheWeekAction(employeeName: User) {
    console.log(`${employeeName} is now Employee of the Week!`);
    // This is a placeholder action.
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: `${employeeName} is now Employee of the Week!` };
}
