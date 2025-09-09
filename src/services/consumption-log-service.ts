
import type { ConsumptionLog, User, ConsumableItem, DrinkItem, MealItem } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { DRINK_ITEMS, MEAL_ITEMS, MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';
import { startOfMonth, endOfMonth } from 'date-fns';

async function getDb() {
    if (!adminDb) {
        throw new Error('Firebase Admin SDK is not initialized.');
    }
    return adminDb;
}

export async function logConsumption(user: User, item: ConsumableItem): Promise<void> {
    const db = await getDb();
    const log: ConsumptionLog = {
        employeeName: user,
        itemName: item,
        dateTimeLogged: new Date(),
    };
    await db.collection('consumption-logs').add(log);
}

export async function getLogsForUser(user: User): Promise<ConsumptionLog[]> {
    const db = await getDb();
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const snapshot = await db.collection('consumption-logs')
        .where('employeeName', '==', user)
        .where('dateTimeLogged', '>=', start)
        .where('dateTimeLogged', '<=', end)
        .orderBy('dateTimeLogged', 'desc')
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            dateTimeLogged: data.dateTimeLogged.toDate(),
        } as ConsumptionLog;
    });
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
    const db = await getDb();
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const snapshot = await db.collection('consumption-logs')
        .where('dateTimeLogged', '>=', start)
        .where('dateTimeLogged', '<=', end)
        .get();

    const logs = snapshot.docs.map(doc => doc.data() as ConsumptionLog);

    const userLogs: Record<User, ConsumptionLog[]> = { 'Abbas': [], 'Musaib': [] };
    logs.forEach(log => {
        if (userLogs[log.employeeName]) {
            userLogs[log.employeeName].push(log);
        }
    });

    const allowances = Object.entries(userLogs).map(([userName, userLogs]) => {
        const drinksConsumed = userLogs.filter(log => DRINK_ITEMS.includes(log.itemName as DrinkItem)).length;
        const mealsConsumed = userLogs.filter(log => MEAL_ITEMS.includes(log.itemName as MealItem)).length;
        return {
            user: userName as User,
            allowances: {
                drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
                meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
            }
        };
    });

    return allowances;
}
