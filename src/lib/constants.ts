
export interface ConsumptionLog {
  employeeName: string;
  itemName: string;
  dateTimeLogged: Date;
}

export const USERS = ['Abbas', 'Musaib'] as const;
export type User = (typeof USERS)[number];

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

export interface LeaveRequest {
  employeeName: User;
  leaveDate: Date;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}
