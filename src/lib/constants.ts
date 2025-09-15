
export interface ConsumptionLog {
  employeeName: string;
  itemName: string;
  dateTimeLogged: Date;
}

// USERS constant is removed in favor of a dynamic list from the database.
export type User = string;

export const DRINK_ITEMS = ['Coffee', 'Cooler', 'Milkshake'] as const;
export type DrinkItem = (typeof DRINK_ITEMS)[number];

export const MEAL_ITEMS = ['Maggie', 'Fries', 'Pasta'] as const;
export type MealItem = (typeof MEAL_ITEMS)[number];

export const ALL_ITEMS = [...DRINK_ITEMS, ...MEAL_ITEMS] as const;
export type ConsumableItem = (typeof ALL_ITEMS)[number];

export const MONTHLY_DRINK_ALLOWANCE = 6;
export const MONTHLY_MEAL_ALLOWANCE = 6;

export interface AttendanceLog {
  employeeName: User;
  clockIn: Date;
  clockOut?: Date;
}

export type AttendanceStatus = {
    status: 'Clocked Out';
} | {
    status: 'Clocked In';
    clockInTime: Date;
};

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type WeekDay = (typeof WEEKDAYS)[number];

export interface Employee {
  id: string;
  name: string;
  weeklyOffDay: WeekDay;
  standardWorkHours: number;
}
