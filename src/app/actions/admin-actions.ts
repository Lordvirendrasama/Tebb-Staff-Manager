'use server';

import { setEmployeeOfTheWeek } from '@/services/awards-service';
import type { User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function setEmployeeOfTheWeekAction(user: User) {
  try {
    await setEmployeeOfTheWeek(user);
    revalidatePath(`/`);
    revalidatePath(`/admin`);
    return { success: true, message: `${user} is now Employee of the Week!` };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to set Employee of the Week.' };
  }
}
