export interface ConsumptionLog {
  employeeName: string;
  itemName: string;
  dateTimeLogged: string;
}

export type User = 'Mario' | 'Luigi' | 'Peach' | 'Musaib';

export const ALL_USERS: User[] = ['Mario', 'Luigi', 'Peach', 'Musaib'];

export const DRINK_ITEMS = ['Coffee', 'Cooler', 'Milkshake'] as const;
export type DrinkItem = typeof DRINK_ITEMS[number];

export const MEAL_ITEMS = ['Maggie', 'Fries', 'Pasta'] as const;
export type MealItem = typeof MEAL_ITEMS[number];

export const ALL_ITEMS = [...DRINK_ITEMS, ...MEAL_ITEMS] as const;
export type ConsumableItem = typeof ALL_ITEMS[number];

export const MONTHLY_DRINK_ALLOWANCE = 6;
export const MONTHLY_MEAL_ALLOWANCE = 6;

export interface Employee {
  name: User;
  weeklyOffDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  standardWorkHours: number;
}
