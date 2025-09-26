'use server';

import type { User, ConsumableItem } from '@/lib/constants';
import { getRemainingAllowances, getConsumableItems } from '@/services/consumption-log-service';
import { revalidatePath } from 'next/cache';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export async function logItemAction(user: User, itemName: ConsumableItem) {
  try {
    const allowances = await getRemainingAllowances(user);
    const items = await getConsumableItems();
    const item = items.find(i => i.name === itemName);

    if (!item) {
      return { success: false, message: 'Item not found.' };
    }

    if (item.type === 'Drink' && allowances.drinks <= 0) {
      return { success: false, message: 'No drink allowance left.' };
    }
    if (item.type === 'Meal' && allowances.meals <= 0) {
      return { success: false, message: 'No meal allowance left.' };
    }

    await addDoc(collection(db, 'consumptionLogs'), {
      employeeName: user,
      itemName: itemName,
      dateTimeLogged: new Date(),
    });

    revalidatePath(`/dashboard/${user}`);
    revalidatePath('/admin');
    return { success: true, message: `${itemName} logged successfully.` };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to log item: ${errorMessage}` };
  }
}
