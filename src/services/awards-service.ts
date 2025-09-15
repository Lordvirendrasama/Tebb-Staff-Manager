
'use server';

import type { User } from '@/lib/constants';
import * as data from '@/lib/data';

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
    const db = data.readDb();
    const employees = db.employees.map(e => e.name);
    if (employees.includes(employeeName)) {
        data.setEmployeeOfTheWeek(employeeName);
    } else {
        throw new Error("Employee not found");
    }
}

export async function getEmployeeOfTheWeek(): Promise<User | null> {
    return data.getEmployeeOfTheWeek();
}
