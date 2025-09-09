
'use server';

import type { User, ConsumableItem } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export async function logItemAction(user: User, itemName: ConsumableItem) {
    console.log(`Item logged for ${user}: ${itemName}`);
    // This is a placeholder action.
    revalidatePath('/dashboard/Abbas');
    revalidatePath('/dashboard/Musaib');
    revalidatePath('/admin');
    return { success: true, message: `${itemName} logged successfully.` };
}
