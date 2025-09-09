
'use server';

import type { User, ConsumableItem, ConsumptionLog } from '@/lib/constants';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, DRINK_ITEMS, MEAL_ITEMS } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';

async function getDb() {
    if (!adminDb) {
        throw new Error('Firebase Admin SDK is not initialized.');
    }
    return adminDb;
}

// This function is required by the GenAI flow.
export async function getAllConsumptionLogs(): Promise<ConsumptionLog[]> {
    try {
        const db = await getDb();
        const consumptionCol = collection(db, 'consumptionLogs');
        const snapshot = await getDocs(consumptionCol);
        const logs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            dateTimeLogged: (data.dateTimeLogged as Timestamp).toDate(),
          } as ConsumptionLog;
        });
        return logs;
    } catch (e) {
        console.error("Could not fetch all consumption logs", e);
        return [];
    }
}

export async function getLogsForUser(employeeName: User): Promise<ConsumptionLog[]> {
  try {
    const db = await getDb();
    const q = query(collection(db, 'consumptionLogs'), where('employeeName', '==', employeeName));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          dateTimeLogged: (data.dateTimeLogged as Timestamp).toDate(),
        } as ConsumptionLog;
    });
    return logs.sort((a, b) => b.dateTimeLogged.getTime() - a.dateTimeLogged.getTime());
  } catch (e) {
    console.error(`Could not fetch logs for user ${employeeName}`, e);
    return [];
  }
}

export async function getRemainingAllowances(employeeName: User): Promise<{ drinks: number; meals: number }> {
    try {
        const userLogs = await getLogsForUser(employeeName);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const logsThisMonth = userLogs.filter(log => {
            const logDate = new Date(log.dateTimeLogged);
            return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
        });

        const drinksConsumed = logsThisMonth.filter(log => (DRINK_ITEMS as readonly string[]).includes(log.itemName)).length;
        const mealsConsumed = logsThisMonth.filter(log => (MEAL_ITEMS as readonly string[]).includes(log.itemName)).length;

        const drinksLeft = MONTHLY_DRINK_ALLOWANCE - drinksConsumed;
        const mealsLeft = MONTHLY_MEAL_ALLOWANCE - mealsConsumed;

        return {
            drinks: Math.max(0, drinksLeft),
            meals: Math.max(0, mealsLeft),
        };
    } catch (e) {
        console.error(`Could not fetch remaining allowances for user ${employeeName}`, e);
        return { drinks: MONTHLY_DRINK_ALLOWANCE, meals: MONTHLY_MEAL_ALLOWANCE };
    }
}


export async function logConsumption(employeeName: User, itemName: ConsumableItem): Promise<void> {
    const db = await getDb();
    
    const allowances = await getRemainingAllowances(employeeName);
    const isDrink = (DRINK_ITEMS as readonly string[]).includes(itemName);

    if (isDrink && allowances.drinks <= 0) {
        throw new Error('No drink allowance left to log item.');
    }
    if (!isDrink && allowances.meals <= 0) {
        throw new Error('No meal allowance left to log item.');
    }

    await addDoc(collection(db, 'consumptionLogs'), {
        employeeName,
        itemName,
        dateTimeLogged: new Date(),
    });
}
