
'use server';

import type { User, LeaveType } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { getAttendanceStatus } from '@/services/attendance-service';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, getDoc, endAt, startAt } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { isBefore, startOfMonth, endOfMonth } from 'date-fns';

export async function clockInAction(user: User) {
    try {
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
            
            // Check if the latest log is from a previous day and wasn't clocked out
            if (!latestLog.clockOut && new Date(latestLog.clockIn.toDate()).toDateString() !== new Date().toDateString()) {
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
        revalidatePath('/admin');
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
        revalidatePath('/admin');
        return { success: true, message: 'Clocked out successfully.' };
    } catch (error) {
        console.error(error)
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to clock out: ${errorMessage}` };
    }
}

export async function getAttendanceForMonthAction(employeeName: User, month: Date) {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employeeName),
        where('clockIn', '>=', start),
        where('clockIn', '<=', end),
        orderBy('clockIn', 'asc')
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      clockIn: d.data().clockIn.toDate(),
      clockOut: d.data().clockOut ? d.data().clockOut.toDate() : null,
    }));
    return logs;
}


export async function updateAttendanceForDayAction(employeeName: User, day: Date, clockInTime: string | null, clockOutTime: string | null) {
  try {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

    const q = query(
      collection(db, 'attendanceLogs'),
      where('employeeName', '==', employeeName),
      where('clockIn', '>=', start),
      where('clockIn', '<=', end)
    );
    const snapshot = await getDocs(q);
    const existingLog = snapshot.docs[0];

    if (!clockInTime || !clockOutTime) { // Delete record
      if (existingLog) {
        await deleteDoc(existingLog.ref);
        revalidatePath('/admin');
        return { success: true, message: 'Attendance record deleted.' };
      }
      return { success: true, message: 'No record to delete.' }; // No existing log and no new times
    }

    const [inHours, inMinutes] = clockInTime.split(':').map(Number);
    const [outHours, outMinutes] = clockOutTime.split(':').map(Number);

    const newClockIn = new Date(day.getFullYear(), day.getMonth(), day.getDate(), inHours, inMinutes);
    const newClockOut = new Date(day.getFullYear(), day.getMonth(), day.getDate(), outHours, outMinutes);

    if (newClockOut <= newClockIn) {
      newClockOut.setDate(newClockOut.getDate() + 1);
    }
    
    if (existingLog) {
      await updateDoc(existingLog.ref, { clockIn: newClockIn, clockOut: newClockOut });
    } else {
      await addDoc(collection(db, 'attendanceLogs'), {
        employeeName,
        clockIn: newClockIn,
        clockOut: newClockOut,
      });
    }

    revalidatePath('/admin');
    return { success: true, message: 'Attendance updated successfully.' };

  } catch (error) {
    console.error('Failed to update attendance', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update attendance: ${errorMessage}` };
  }
}
