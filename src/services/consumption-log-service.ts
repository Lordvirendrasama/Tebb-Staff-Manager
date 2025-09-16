
import { collection, getDocs, query, where, orderBy, addDoc } from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { ConsumptionLog, User, ConsumableItem, DrinkItem, MealItem } from '@/lib/constants';
import { DRINK_ITEMS, MEAL_ITEMS, MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';
import { getEmployees } from './attendance-service';
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

async function docsWithDates<T>(querySnapshot: any): Promise<T[]> {
    const promises: Promise<T>[] = [];
    querySnapshot.forEach((doc: any) => {
        promises.push(docWithDates<T>(doc));
    });
    return Promise.all(promises);
}

export async function logConsumption(user: User, item: ConsumableItem): Promise<void> {
    await addDoc(collection(db, 'consumptionLogs'), {
        employeeName: user,
        itemName: item,
        dateTimeLogged: new Date(),
    });
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
        orderBy('dateTimeLogged', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return docsWithDates<ConsumptionLog>(querySnapshot);
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

export async function getAllUsersAllowances(): Promise<Array<{ user: User; allowances: { drinks: number; meals: number } }>> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const employees = await getEmployees();
    const users = employees.map(e => e.name);
    
    const q = query(
        collection(db, 'consumptionLogs'),
        where('dateTimeLogged', '>=', start),
        where('dateTimeLogged', '<=', end)
    );
    const querySnapshot = await getDocs(q);
    const logs = await docsWithDates<ConsumptionLog>(querySnapshot);

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
        const drinksConsumed = currentUserLogs.filter(log => DRINK_ITEMS.includes(log.itemName as DrinkItem)).length;
        const mealsConsumed = currentUserLogs.filter(log => MEAL_ITEMS.includes(log.itemName as MealItem)).length;
        return {
            user: user,
            allowances: {
                drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
                meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
            }
        };
    });

    return allowances;
}
