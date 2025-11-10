
import { type } from "os";

export type User = string;

export const DEFAULT_EMPLOYEES = [
  { name: 'Abbas', weeklyOffDay: 'Monday', standardWorkHours: 8, shiftStartTime: '10:00', shiftEndTime: '18:00' },
  { name: 'Musaib', weeklyOffDay: 'Sunday', standardWorkHours: 7, shiftStartTime: '16:00', shiftEndTime: '23:00' },
  { name: 'Viren', weeklyOffDay: 'Friday', standardWorkHours: 8, shiftStartTime: '10:00', shiftEndTime: '18:00' },
] as const;


export const MONTHLY_DRINK_ALLOWANCE = 6;
export const MONTHLY_MEAL_ALLOWANCE = 6;

export type ItemType = 'Drink' | 'Meal';
export const ITEM_TYPES: ItemType[] = ['Drink', 'Meal'];

export interface ConsumableItemDef {
  id: string;
  name: string;
  type: ItemType;
}

export type ConsumableItem = string;

export interface ConsumptionLog {
  employeeName: User;
  itemName: ConsumableItem;
  dateTimeLogged: Date;
}

export type WeekDay = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export const WEEKDAYS: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type PayFrequency = 'weekly' | 'bi-weekly' | 'monthly';
export const PAY_FREQUENCIES: PayFrequency[] = ['weekly', 'bi-weekly', 'monthly'];

export interface Employee {
  id: string;
  name: User;
  weeklyOffDay: WeekDay;
  standardWorkHours: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
  monthlySalary?: number;
  payFrequency?: PayFrequency;
  payStartDate?: string;
}

export interface AttendanceStatus {
    status: 'Clocked In' | 'Clocked Out';
    clockInTime?: Date;
}

export interface AttendanceLog {
    id: string;
    employeeName: User;
    clockIn: Date;
    clockOut?: Date;
}

export const ESPRESSO_DRINKS = ['Espresso', 'Double Espresso'] as const;
export type EspressoDrink = typeof ESPRESSO_DRINKS[number];

export interface EspressoLog {
  id: string;
  employeeName: User;
  coffeeType: EspressoDrink;
  timeTaken: number; // in milliseconds
  coffeeUsed: number; // in grams
  pullDateTime: Date;
  groupHead: 1 | 2;
}
