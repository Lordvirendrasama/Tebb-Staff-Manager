
'use server';

import { clockIn, clockOut, requestLeave } from '@/services/attendance-service';
import type { User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function clockInAction(user: User) {
  try {
    await clockIn(user);
    revalidatePath(`/dashboard/${user}`);
    return { success: true, message: 'Clocked in successfully.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to clock in.' };
  }
}

export async function clockOutAction(user: User) {
  try {
    await clockOut(user);
    revalidatePath(`/dashboard/${user}`);
    return { success: true, message: 'Clocked out successfully.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to clock out.' };
  }
}

export async function requestLeaveAction(user: User, leaveDate: Date, reason: string) {
    try {
        await requestLeave(user, leaveDate, reason);
        revalidatePath(`/dashboard/${user}`);
        return { success: true, message: 'Leave requested successfully.' };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'Failed to request leave.' };
    }
}
