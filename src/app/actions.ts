
'use server';

import { logConsumption } from '@/services/consumption-log-service';
import type { User, ConsumableItem } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function logItemAction(user: User, itemName: ConsumableItem) {
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
