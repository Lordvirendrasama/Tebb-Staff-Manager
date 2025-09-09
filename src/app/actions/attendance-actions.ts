
'use server';

import type { User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { clockIn, clockOut, requestLeave, getAttendanceStatus } from '@/services/attendance-service';

export async function clockInAction(user: User) {
    try {
        const status = await getAttendanceStatus(user);
        if (status.status === 'Clocked In') {
            return { success: false, message: 'You are already clocked in.' };
        }
        await clockIn(user);
        revalidatePath(`/dashboard/${user}`);
        revalidatePath('/');
        return { success: true, message: 'Clocked in successfully.' };
    } catch (error) {
        return { success: false, message: 'An error occurred.' };
    }
}

export async function clockOutAction(user: User) {
    try {
        const status = await getAttendanceStatus(user);
        if (status.status === 'Clocked Out') {
            return { success: false, message: 'You are already clocked out.' };
        }
        await clockOut(user);
        revalidatePath(`/dashboard/${user}`);
        revalidatePath('/');
        return { success: true, message: 'Clocked out successfully.' };
    } catch (error) {
        return { success: false, message: 'An error occurred.' };
    }
}

export async function requestLeaveAction(user: User, leaveDate: Date, reason: string) {
    try {
        await requestLeave(user, leaveDate, reason);
        revalidatePath(`/dashboard/${user}`);
        return { success: true, message: 'Leave requested successfully.' };
    } catch (error) {
        return { success: false, message: 'An error occurred.' };
    }
}
