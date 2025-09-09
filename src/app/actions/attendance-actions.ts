
'use server';

import type { User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function clockInAction(user: User) {
    console.log(`${user} clocked in.`);
    // This is a placeholder action.
    revalidatePath(`/dashboard/${user}`);
    return { success: true, message: 'Clocked in successfully.' };
}

export async function clockOutAction(user: User) {
    console.log(`${user} clocked out.`);
    // This is a placeholder action.
    revalidatePath(`/dashboard/${user}`);
    return { success: true, message: 'Clocked out successfully.' };
}

export async function requestLeaveAction(user: User, leaveDate: Date, reason: string) {
    console.log(`Leave requested for ${user} on ${leaveDate} for ${reason}`);
    // This is a placeholder action.
    revalidatePath(`/dashboard/${user}`);
    return { success: true, message: 'Leave requested successfully.' };
}
