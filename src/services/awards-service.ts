
'use server';
import { getEmployeeOfTheWeek } from '@/app/actions/admin-actions';

// This is a wrapper so client components can call the server action
export async function getEmployeeOfTheWeekAction() {
    return getEmployeeOfTheWeek();
}
