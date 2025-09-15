
'use server';

import type { User, LeaveType } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { clockIn, clockOut, getAttendanceStatus, requestLeave, approveLeave, denyLeave } from '@/services/attendance-service';

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

export async function requestLeaveAction(user: User, startDate: Date, endDate: Date, reason: string, leaveType: LeaveType) {
    try {
        await requestLeave(user, startDate, endDate, reason, leaveType);
        revalidatePath(`/dashboard/${user}`);
        revalidatePath('/admin');
        return { success: true, message: 'Leave request submitted successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to submit leave request.' };
    }
}

export async function approveLeaveAction(requestId: string) {
    try {
        await approveLeave(requestId);
        revalidatePath('/admin');
        return { success: true, message: 'Leave request approved.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to approve leave request.' };
    }
}

export async function denyLeaveAction(requestId: string) {
    try {
        await denyLeave(requestId);
        revalidatePath('/admin');
        return { success: true, message: 'Leave request denied.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to deny leave request.' };
    }
}
