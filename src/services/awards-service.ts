
'use server';
import { doc, onSnapshot } from 'firebase/firestore';
import { getEmployeeOfTheWeek } from '@/app/actions/admin-actions';
import { db } from '@/lib/firebase-client';
import type { User } from '@/lib/constants';

// This is a wrapper so client components can call the server action
export async function getEmployeeOfTheWeekAction() {
    return getEmployeeOfTheWeek();
}
