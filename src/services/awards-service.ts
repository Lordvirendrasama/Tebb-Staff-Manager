
'use server';

import type { User } from '@/lib/constants';
import * as data from '@/lib/data';

export async function setEmployeeOfTheWeek(employeeName: User): Promise<void> {
    data.setEmployeeOfTheWeek(employeeName);
}

export async function getEmployeeOfTheWeek(): Promise<User | null> {
    return data.getEmployeeOfTheWeek();
}
