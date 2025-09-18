
'use server';

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { ConsumptionLog, User, ConsumableItemDef } from '@/lib/constants';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';
import { db } from '@/lib/firebase-client';
import { getEmployees } from './attendance-service';

async function docWithIdAndDates<T>(docSnap: any): Promise<T> {
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

export async function getConsumableItems(): Promise<ConsumableItemDef[]> {
    const snapshot = await getDocs(query(collection(db, 'consumableItems'), orderBy('name')));
    return await Promise.all(snapshot.docs.map(doc => docWithIdAndDates<ConsumableItemDef>(doc)));
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
    const userLogs = await Promise.all(querySnapshot.docs.map(doc => docWithIdAndDates<ConsumptionLog>(doc)));
    
    return userLogs.sort((a, b) => b.dateTimeLogged.getTime() - a.dateTimeLogged.getTime());
}

export async function getRemainingAllowances(user: User): Promise<{ drinks: number, meals: number }> {
    const logs = await getLogsForUser(user);
    const allItems = await getConsumableItems();
    const drinkNames = allItems.filter(i => i.type === 'Drink').map(i => i.name);
    const mealNames = allItems.filter(i => i.type === 'Meal').map(i => i.name);
    
    const drinksConsumed = logs.filter(log => drinkNames.includes(log.itemName)).length;
    const mealsConsumed = logs.filter(log => mealNames.includes(log.itemName)).length;

    return {
        drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
        meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
    };
}

export async function getAllUsersAllowances(): Promise<Array<{ user: User; allowances: { drinks: number; meals: number } }>> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const employees = await getEmployees();
    
    if (employees.length === 0) return [];
    
    const users = employees.map(e => e.name);

    const allItems = await getConsumableItems();
    const drinkNames = allItems.filter(i => i.type === 'Drink').map(i => i.name);
    const mealNames = allItems.filter(i => i.type === 'Meal').map(i => i.name);
    
    const q = query(
        collection(db, 'consumptionLogs'),
        where('dateTimeLogged', '>=', start),
        where('dateTimeLogged', '<=', end)
    );
    const querySnapshot = await getDocs(q);
    const logs = await Promise.all(querySnapshot.docs.map(doc => docWithIdAndDates<ConsumptionLog>(doc)));

    const userLogs: Record<User, ConsumptionLog[]> = users.reduce((acc, name) => {
        acc[name] = [];
        return acc;
    }, {} as Record<User, ConsumptionLog[]>);

    logs.forEach(log => {
        if (userLogs[log.employeeName]) {
            userLogs[log.employeeName].push(log);
        }
    });

    const allowances = users.map(user => {
        const currentUserLogs = userLogs[user] || [];
        const drinksConsumed = currentUserLogs.filter(log => drinkNames.includes(log.itemName)).length;
        const mealsConsumed = currentUserLogs.filter(log => mealNames.includes(log.itemName)).length;
        return {
            user: user,
            allowances: {
                drinks: Math.max(0, MONTHLY_DRINK_ALLOWANCE - drinksConsumed),
                meals: Math.max(0, MONTHLY_MEAL_ALLOWANCE - mealsConsumed),
            }
        };
    });

    return allowances;
}
