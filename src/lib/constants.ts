
export interface ConsumptionLog {
  id: string;
  employeeName: string;
  itemName: string;
  dateTimeLogged: Date;
}

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
  id: string;
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

export const PAY_FREQUENCIES = ['weekly', 'bi-weekly', 'monthly'] as const;
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export interface Employee {
  id: string;
  name: string;
  weeklyOffDay: WeekDay;
  standardWorkHours: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
  monthlySalary?: number;
  payFrequency?: PayFrequency;
  payStartDate?: Date;
}

export const LEAVE_TYPES = ['Paid (Scheduled)', 'Paid (Made Up)', 'Unpaid'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Denied'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface LeaveRequest {
  id: string;
  employeeName: User;
  startDate: Date;
  endDate: Date;
  reason: string;
  leaveType: LeaveType;
  status: LeaveStatus;
}

export const DEFAULT_EMPLOYEES: Omit<Employee, 'id'>[] = [
  { 
    name: 'Mario', 
    weeklyOffDay: 'Tuesday', 
    standardWorkHours: 8, 
    shiftStartTime: '09:00', 
    shiftEndTime: '17:00',
    monthlySalary: 30000,
    payFrequency: 'monthly',
    payStartDate: new Date('2024-07-01')
  },
  { 
    name: 'Luigi', 
    weeklyOffDay: 'Wednesday', 
    standardWorkHours: 8, 
    shiftStartTime: '09:00', 
    shiftEndTime: '17:00',
    monthlySalary: 28000,
    payFrequency: 'monthly',
    payStartDate: new Date('2024-07-01')
  },
  { 
    name: 'Peach', 
    weeklyOffDay: 'Thursday', 
    standardWorkHours: 6, 
    shiftStartTime: '12:00', 
    shiftEndTime: '18:00',
    monthlySalary: 25000,
    payFrequency: 'monthly',
    payStartDate: new Date('2024-07-01')
  },
];

export const ITEM_TYPES = ['Drink', 'Meal'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export interface ConsumableItemDef {
  id: string;
  name: string;
  type: ItemType;
}

export const ESPRESSO_DRINKS = [
    'Espresso', 'Double Espresso', 'Latte', 'Americano', 
    'Cappuccino', 'Iced Latte', 'Iced Americano'
] as const;

export type EspressoDrink = (typeof ESPRESSO_DRINKS)[number];

export interface EspressoLog {
    id: string;
    employeeName: User;
    coffeeType: EspressoDrink;
    timeTaken: number; // in seconds
    coffeeUsed: number; // in grams
    pullDateTime: Date;
}

export const PAYROLL_STATUSES = ['pending', 'paid'] as const;
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

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
  tips?: number;
  deductions?: number;
  finalSalary: number;
  status: PayrollStatus;
  paymentDate?: Date;
  generatedAt: Date;
}
