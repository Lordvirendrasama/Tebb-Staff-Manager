'use server';

import {
  User,
  ConsumableItem,
  getRemainingAllowances,
} from '@/services/server/consumption-log-service';
import { revalidatePath } from 'next/cache';

export async function logItemAction(user: User, itemName: ConsumableItem) {
  try {
    const allowances = await getRemainingAllowances(user);
    if (
      (itemName === 'Coffee' || itemName === 'Cooler' || itemName === 'Milkshake') &&
      allowances.drinks <= 0
    ) {
      return { success: false, message: 'No drink allowance left.' };
    }
    if ((itemName === 'Maggie' || itemName === 'Fries' || itemName === 'Pasta') && allowances.meals <= 0) {
      return { success: false, message: 'No meal allowance left.' };
    }

    const res = await fetch(
      'https://firestore.googleapis.com/v1/projects/staff-manager-e952a/databases/(default)/documents/consumptionLogs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            employeeName: { stringValue: user },
            itemName: { stringValue: itemName },
            dateTimeLogged: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Firestore Error:', errorData);
      throw new Error('Failed to log item to Firestore.');
    }

    revalidatePath(`/dashboard/${user}`);
    return { success: true, message: `${itemName} logged successfully.` };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'An error occurred while logging the item.' };
  }
}
