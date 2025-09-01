'use server';

// In-memory store for consumption logs
export interface ConsumptionLog {
  employeeName: string;
  itemName: string;
  dateTimeLogged: Date;
}

let consumptionLogs: ConsumptionLog[] = [];

export const USERS = ['Abbas', 'Musaib'] as const;
export type User = (typeof USERS)[number];

export const FOOD_ITEMS = ['Coffee', 'Cooler', 'Milkshake', 'Maggie', 'Fries', 'Pasta'] as const;
export type FoodItem = (typeof FOOD_ITEMS)[number];

export const MONTHLY_ALLOWANCE = 6;

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

export async function getRemainingAllowance(employeeName: User): Promise<number> {
  const userLogs = await getLogsForUser(employeeName);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const logsThisMonth = userLogs.filter(log => {
    const logDate = new Date(log.dateTimeLogged);
    return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
  });

  const allowanceLeft = MONTHLY_ALLOWANCE - logsThisMonth.length;
  return Math.max(0, allowanceLeft);
}

export async function logConsumption(employeeName: User, itemName: FoodItem): Promise<void> {
  const allowance = await getRemainingAllowance(employeeName);
  if (allowance <= 0) {
    throw new Error('No allowance left to log item.');
  }
  consumptionLogs.push({
    employeeName,
    itemName,
    dateTimeLogged: new Date(),
  });
  return Promise.resolve();
}
