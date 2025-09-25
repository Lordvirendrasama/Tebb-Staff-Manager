
'use server';

import type { User, EspressoDrink } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export async function logEspressoPullAction(
    employeeName: User,
    coffeeType: EspressoDrink,
    timeTaken: number,
    coffeeUsed: number
) {
    try {
        await addDoc(collection(db, 'espressoLogs'), {
            employeeName,
            coffeeType,
            timeTaken,
            coffeeUsed,
            pullDateTime: new Date(),
        });

        revalidatePath('/espresso-tracker');
        return { success: true, message: 'Espresso pull logged successfully.' };
    } catch (error) {
        console.error('Failed to log espresso pull:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to log pull: ${errorMessage}` };
    }
}
