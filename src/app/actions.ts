'use server';

import { logConsumption, User, FoodItem } from '@/services/consumption-log-service';
import { revalidatePath } from 'next/cache';

export async function logItemAction(user: User, itemName: FoodItem) {
  try {
    await logConsumption(user, itemName);
    revalidatePath(`/dashboard/${user}`);
    revalidatePath('/admin');
    return { success: true, message: `${itemName} logged successfully.` };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to log item.' };
  }
}
