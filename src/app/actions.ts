
'use server';

import type { User, ConsumableItem } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { logConsumption, getRemainingAllowances } from '@/services/consumption-log-service';
import { MEAL_ITEMS, DRINK_ITEMS } from '@/lib/constants';

export async function logItemAction(user: User, itemName: ConsumableItem) {
    try {
        const allowances = await getRemainingAllowances(user);
        const isMeal = MEAL_ITEMS.includes(itemName as any);
        const isDrink = DRINK_ITEMS.includes(itemName as any);

        if ((isMeal && allowances.meals <= 0) || (isDrink && allowances.drinks <= 0)) {
            return { success: false, message: 'No allowance left for this item.' };
        }

        await logConsumption(user, itemName);
        revalidatePath(`/dashboard/${user}`);
        revalidatePath('/admin');
        return { success: true, message: `${itemName} logged successfully.` };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'An error occurred while logging the item.' };
    }
}
