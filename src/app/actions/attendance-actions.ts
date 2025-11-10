
'use server';

import type { User, LeaveType } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { getAttendanceStatus } from '@/services/attendance-service';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { startOfDay, endOfDay, isWithinInterval, isBefore, setHours, setMinutes, setSeconds, setMilliseconds, addDays, getYear, getMonth, getDate } from 'date-fns';


export async function clockInAction(user: User) {
    try {
        // First, check for any open shifts from previous days and close them.
        const q = query(
            collection(db, 'attendanceLogs'),
            where('employeeName', '==', user),
            orderBy('clockIn', 'desc'),
            limit(1)
        );
        const latestLogSnapshot = await getDocs(q);

        if (!latestLogSnapshot.empty) {
            const latestLogDoc = latestLogSnapshot.docs[0];
            const latestLog = latestLogDoc.data();
            
            if (!latestLog.clockOut && isBefore(latestLog.clockIn.toDate(), startOfDay(new Date()))) {
                // The employee forgot to clock out on a previous day.
                // We'll automatically clock them out at their shift end time.
                const employeeSnap = await getDocs(query(collection(db, 'employees'), where('name', '==', user)));

                if (!employeeSnap.empty) {
                    const employeeData = employeeSnap.docs[0].data();
                    const [endHour, endMinute] = (employeeData.shiftEndTime || '18:00').split(':').map(Number);
                    
                    const clockOutTime = latestLog.clockIn.toDate();
                    clockOutTime.setHours(endHour, endMinute, 0, 0);

                    await updateDoc(latestLogDoc.ref, { clockOut: clockOutTime });
                }
            }
        }
        
        // Now, proceed with the clock-in logic.
        const status = await getAttendanceStatus(user);
        if (status.status === 'Clocked In') {
            return { success: false, message: 'You are already clocked in.' };
        }
        
        await addDoc(collection(db, 'attendanceLogs'), {
            employeeName: user,
            clockIn: new Date(),
            clockOut: null,
        });

        revalidatePath(`/dashboard/${user}`);
        revalidatePath('/');
        return { success: true, message: 'Clocked in successfully.' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to clock in: ${errorMessage}` };
    }
}

export async function clockOutAction(user: User) {
    try {
        const status = await getAttendanceStatus(user);
        if (status.status === 'Clocked Out') {
            return { success: false, message: 'You are already clocked out.' };
        }

        const q = query(
            collection(db, 'attendanceLogs'),
            where('employeeName', '==', user),
            orderBy('clockIn', 'desc'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const latestLogDoc = querySnapshot.docs[0];
            const docRef = doc(db, 'attendanceLogs', latestLogDoc.id);
            await updateDoc(docRef, { clockOut: new Date() });
        } else {
            return { success: false, message: 'No clock-in record found to clock out.' };
        }

        revalidatePath(`/dashboard/${user}`);
        revalidatePath('/');
        return { success: true, message: 'Clocked out successfully.' };
    } catch (error) {
        console.error(error)
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to clock out: ${errorMessage}` };
    }
}
