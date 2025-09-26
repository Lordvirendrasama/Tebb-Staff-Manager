'use server';
import {
  ALL_USERS,
  MONTHLY_DRINK_ALLOWANCE,
  MONTHLY_MEAL_ALLOWANCE,
} from '@/lib/constants';
import type { ConsumptionLog, User } from '@/lib/constants';

async function getLogsForUser(user: User): Promise<ConsumptionLog[]> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/staff-manager-e952a/databases/(default)/documents/consumptionLogs`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (!data.documents) return [];

    const allLogs: ConsumptionLog[] = data.documents.map((doc: any) => ({
      employeeName: doc.fields.employeeName.stringValue,
      itemName: doc.fields.itemName.stringValue,
      dateTimeLogged: doc.fields.dateTimeLogged.timestampValue,
    }));
    
    const userLogs = allLogs.filter(log => {
      const logDate = new Date(log.dateTimeLogged);
      return log.employeeName === user && logDate >= startOfMonth && logDate <= endOfMonth;
    });

    return userLogs.sort((a, b) => new Date(b.dateTimeLogged).getTime() - new Date(a.dateTimeLogged).getTime());
  } catch (error) {
    console.error('Failed to fetch logs for user:', error);
    return [];
  }
}

async function getRemainingAllowances(user: User): Promise<{ drinks: number; meals: number }> {
  const logs = await getLogsForUser(user);
  const drinksConsumed = logs.filter(log =>
    ['Coffee', 'Cooler', 'Milkshake'].includes(log.itemName)
  ).length;
  const mealsConsumed = logs.filter(log =>
    ['Maggie', 'Fries', 'Pasta'].includes(log.itemName)
  ).length;

  return {
    drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
    meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
  };
}

async function getAllUsersAllowances(): Promise<
  Array<{ user: User; allowances: { drinks: number; meals: number } }>
> {
  const allowances = await Promise.all(
    ALL_USERS.map(async user => {
      const userAllowances = await getRemainingAllowances(user);
      return { user, allowances: userAllowances };
    })
  );
  return allowances;
}

export {
  getLogsForUser,
  getRemainingAllowances,
  getAllUsersAllowances,
  User,
  ConsumableItem,
  ConsumptionLog,
};
