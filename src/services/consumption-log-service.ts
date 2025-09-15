
'use server';

import type { ConsumptionLog, User, ConsumableItem, DrinkItem, MealItem } from '@/lib/constants';
import * as data from '@/lib/data';
import { DRINK_ITEMS, MEAL_ITEMS, MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getEmployees } from './attendance-service';

export async function logConsumption(user: User, item: ConsumableItem): Promise<void> {
    const log: Omit<ConsumptionLog, 'id'> = {
        employeeName: user,
        itemName: item,
        dateTimeLogged: new Date(),
    };
    await data.addConsumptionLog(log);
}

export async function getLogsForUser(user: User): Promise<ConsumptionLog[]> {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const allLogs = await data.getConsumptionLogs();

    return allLogs
        .filter(log => 
            log.employeeName === user &&
            log.dateTimeLogged >= start &&
            log.dateTimeLogged <= end
        )
        .sort((a, b) => b.dateTimeLogged.getTime() - a.dateTimeLogged.getTime());
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
    
    const logs = (await data.getConsumptionLogs())
        .filter(log => log.dateTimeLogged >= start && log.dateTimeLogged <= end);

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
