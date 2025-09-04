
'use server';

import type { User, ConsumableItem, ConsumptionLog } from '@/lib/constants';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, DRINK_ITEMS, MEAL_ITEMS } from '@/lib/constants';
import { adminDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';

async function getDb() {
    if (!adminDb) {
        return null;
    }
    return adminDb;
}

// This function is required by the GenAI flow.
export async function getAllConsumptionLogs(): Promise<ConsumptionLog[]> {
    const db = await getDb();
    if (!db) return [];

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
}

export async function getLogsForUser(employeeName: User): Promise<ConsumptionLog[]> {
  const db = await getDb();
  if (!db) return [];

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
}

export async function getRemainingAllowances(employeeName: User): Promise<{ drinks: number; meals: number }> {
    const db = await getDb();
    if (!db) return { drinks: MONTHLY_DRINK_ALLOWANCE, meals: MONTHLY_MEAL_ALLOWANCE };

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
}


export async function logConsumption(employeeName: User, itemName: ConsumableItem): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase Admin SDK is not initialized.');
    }

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
