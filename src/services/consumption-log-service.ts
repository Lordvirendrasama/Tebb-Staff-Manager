
import type { ConsumptionLog, User, ConsumableItem, DrinkItem, MealItem } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { DRINK_ITEMS, MEAL_ITEMS, MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, USERS } from '@/lib/constants';
import { startOfMonth, endOfMonth } from 'date-fns';

async function getDb() {
    if (!adminDb) {
        console.error('Firebase Admin SDK is not initialized.');
        return null;
    }
    return adminDb;
}

export async function logConsumption(user: User, item: ConsumableItem): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    const log: ConsumptionLog = {
        employeeName: user,
        itemName: item,
        dateTimeLogged: new Date(),
    };
    await db.collection('consumption-logs').add(log);
}

export async function getLogsForUser(user: User): Promise<ConsumptionLog[]> {
    const db = await getDb();
    if (!db) return [];

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
    if (!db) {
        return USERS.map(user => ({
            user,
            allowances: {
                drinks: MONTHLY_DRINK_ALLOWANCE,
                meals: MONTHLY_MEAL_ALLOWANCE
            }
        }));
    }

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

    const allowances = USERS.map(user => {
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
