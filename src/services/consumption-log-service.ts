
'use server';

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { ConsumptionLog, User, DrinkItem, MealItem } from '@/lib/constants';
import { DRINK_ITEMS, MEAL_ITEMS, MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';
import { db } from '@/lib/firebase-client';

async function docWithDates<T>(docSnap: any): Promise<T> {
    const data = docSnap.data();
    if (!data) {
        throw new Error('Document data is empty');
    }
    
    const convertedData: { [key: string]: any } = { id: docSnap.id };
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
            convertedData[key] = value.toDate();
        } else {
            convertedData[key] = value;
        }
    }
    return convertedData as T;
}

export async function getLogsForUser(user: User): Promise<ConsumptionLog[]> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const q = query(
        collection(db, 'consumptionLogs'),
        where('employeeName', '==', user),
        where('dateTimeLogged', '>=', start),
        where('dateTimeLogged', '<=', end),
        orderBy('dateTimeLogged', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const userLogs = await Promise.all(querySnapshot.docs.map(doc => docWithDates<ConsumptionLog>(doc)));
    
    return userLogs.sort((a, b) => b.dateTimeLogged.getTime() - a.dateTimeLogged.getTime());
}

export async function getRemainingAllowances(user: User): Promise<{ drinks: number, meals: number }> {
    const logs = await getLogsForUser(user);
    const drinksConsumed = logs.filter(log => DRINK_ITEMS.includes(log.itemName as DrinkItem)).length;
    const mealsConsumed = logs.filter(log => MEAL_ITEMS.includes(log.itemName as MealItem)).length;

    return {
        drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
        meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
    };
}
