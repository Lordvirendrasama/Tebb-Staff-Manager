
export interface ConsumptionLog {
  employeeName: string;
  itemName: string;
  dateTimeLogged: Date;
}

export const USERS = ['Abbas', 'Musaib'] as const;
export type User = (typeof USERS)[number];

export const FOOD_ITEMS = ['Coffee', 'Cooler', 'Milkshake', 'Maggie', 'Fries', 'Pasta'] as const;
export type FoodItem = (typeof FOOD_ITEMS)[number];

export const MONTHLY_ALLOWANCE = 6;
