'use server';

import {
  ALL_USERS,
  MONTHLY_DRINK_ALLOWANCE,
  MONTHLY_MEAL_ALLOWANCE,
  type ConsumptionLog,
  type User,
  type ConsumableItem,
  type ConsumableItemDef
} from '@/lib/constants';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { startOfMonth, endOfMonth } from 'date-fns';

async function getLogsForUser(user: User): Promise<ConsumptionLog[]> {
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

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
            employeeName: data.employeeName,
            itemName: data.itemName,
            dateTimeLogged: data.dateTimeLogged.toDate(),
        } as ConsumptionLog;
    });
}

async function getRemainingAllowances(user: User): Promise<{ drinks: number, meals: number }> {
  const logs = await getLogsForUser(user);
  const items = await getConsumableItems();
  const drinkNames = items.filter(i => i.type === 'Drink').map(i => i.name);
  const mealNames = items.filter(i => i.type === 'Meal').map(i => i.name);
  
  const drinksConsumed = logs.filter(log => drinkNames.includes(log.itemName)).length;
  const mealsConsumed = logs.filter(log => mealNames.includes(log.itemName)).length;

  return {
    drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
    meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
  };
}

async function getAllUsersAllowances(): Promise<Array<{ user: User, allowances: { drinks: number, meals: number } }>> {
  const allowances = await Promise.all(
    ALL_USERS.map(async (user) => {
      const userAllowances = await getRemainingAllowances(user);
      return { user, allowances: userAllowances };
    })
  );
  return allowances;
}

export const getConsumableItems = async (): Promise<ConsumableItemDef[]> => {
    const q = query(collection(db, 'consumableItems'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsumableItemDef));
};


export { getLogsForUser, getRemainingAllowances, getAllUsersAllowances };
