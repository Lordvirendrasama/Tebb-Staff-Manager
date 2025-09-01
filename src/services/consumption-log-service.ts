
'use server';

import type { User, ConsumableItem, ConsumptionLog } from '@/lib/constants';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, DRINK_ITEMS, MEAL_ITEMS } from '@/lib/constants';

// In-memory store for consumption logs
const consumptionLogs: ConsumptionLog[] = [];

// This function is required by the GenAI flow.
export async function getAllConsumptionLogs(): Promise<ConsumptionLog[]> {
  // In a real app, you would fetch this from a database.
  return Promise.resolve(consumptionLogs);
}

export async function getLogsForUser(employeeName: User): Promise<ConsumptionLog[]> {
  const allLogs = await getAllConsumptionLogs();
  return allLogs
    .filter(log => log.employeeName === employeeName)
    .sort((a, b) => b.dateTimeLogged.getTime() - a.dateTimeLogged.getTime());
}

export async function getRemainingAllowances(employeeName: User): Promise<{ drinks: number; meals: number }> {
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
    const allowances = await getRemainingAllowances(employeeName);
    const isDrink = (DRINK_ITEMS as readonly string[]).includes(itemName);

    if (isDrink && allowances.drinks <= 0) {
        throw new Error('No drink allowance left to log item.');
    }
    if (!isDrink && allowances.meals <= 0) {
        throw new Error('No meal allowance left to log item.');
    }

    consumptionLogs.push({
        employeeName,
        itemName,
        dateTimeLogged: new Date(),
    });
    return Promise.resolve();
}
