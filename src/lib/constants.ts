
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

export interface Employee {
  id: string;
  name: string;
  weeklyOffDay: WeekDay;
  standardWorkHours: number;
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

export const DEFAULT_EMPLOYEES = [
  { name: 'Mario', weeklyOffDay: 'Tuesday', standardWorkHours: 8 },
  { name: 'Luigi', weeklyOffDay: 'Wednesday', standardWorkHours: 8 },
  { name: 'Peach', weeklyOffDay: 'Thursday', standardWorkHours: 6 },
];

export const ITEM_TYPES = ['Drink', 'Meal'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export interface ConsumableItemDef {
  id: string;
  name: string;
  type: ItemType;
}

