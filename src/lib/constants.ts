
import { type } from "os";

export type User = string;

export const DEFAULT_EMPLOYEES = [
  { name: 'Abbas', weeklyOffDay: 'Monday', standardWorkHours: 8, shiftStartTime: '10:00', shiftEndTime: '18:00', monthlySalary: 33000, payFrequency: 'monthly', payStartDate: '2024-05-01' },
  { name: 'Musaib', weeklyOffDay: 'Sunday', standardWorkHours: 9, shiftStartTime: '09:00', shiftEndTime: '18:00', monthlySalary: 35000, payFrequency: 'monthly', payStartDate: '2024-05-01' },
  { name: 'Viren', weeklyOffDay: 'Friday', standardWorkHours: 8, shiftStartTime: '10:00', shiftEndTime: '18:00', monthlySalary: 40000, payFrequency: 'monthly', payStartDate: '2024-05-01' },
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

export type PayFrequency = 'monthly' | 'bi-weekly' | 'weekly';
export const PAY_FREQUENCIES: PayFrequency[] = ['monthly', 'bi-weekly', 'weekly'];

export interface Employee {
  id: string;
  name: User;
  weeklyOffDay: WeekDay;
  standardWorkHours: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
  // Payroll info
  monthlySalary?: number;
  payFrequency?: PayFrequency;
  payStartDate?: Date | string; // Date of first day of current pay cycle
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

export type LeaveType = 'Paid' | 'Unpaid' | 'Paid (Made Up)';
export const LEAVE_TYPES: LeaveType[] = ['Paid', 'Unpaid', 'Paid (Made Up)'];

export interface LeaveRequest {
    id: string;
    employeeName: User;
    startDate: Date;
    endDate: Date;
    reason: string;
    leaveType: LeaveType;
    status: 'Pending' | 'Approved' | 'Denied';
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

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  monthlySalary: number;
  totalWorkingDays: number;
  actualDaysWorked: number;
  perDaySalary: number;
  lateDays: number;
  lateDeductions: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeductions: number;
  tips: number;
  deductions: number; // Other deductions
  finalSalary: number;
  status: 'pending' | 'paid';
  generatedAt: Date;
  paymentDate?: Date;
}
