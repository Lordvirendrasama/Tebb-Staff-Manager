
'use server';

import type { User, LeaveType } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { getAttendanceStatus } from '@/services/attendance-service';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';


export async function clockInAction(user: User) {
    try {
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

export async function requestLeaveAction(user: User, startDate: Date, endDate: Date, reason: string, leaveType: LeaveType) {
    try {
        await addDoc(collection(db, 'leaveRequests'), {
            employeeName: user,
            startDate,
            endDate,
            reason,
            leaveType,
            status: 'Pending',
        });
        revalidatePath(`/dashboard/${user}`);
        revalidatePath('/admin');
        return { success: true, message: 'Leave request submitted successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to submit leave request.' };
    }
}

export async function approveLeaveAction(requestId: string) {
    try {
        const docRef = doc(db, 'leaveRequests', requestId);
        await updateDoc(docRef, { status: 'Approved' });
        revalidatePath('/admin');
        return { success: true, message: 'Leave request approved.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to approve leave request.' };
    }
}

export async function denyLeaveAction(requestId: string) {
    try {
        const docRef = doc(db, 'leaveRequests', requestId);
        await updateDoc(docRef, { status: 'Denied' });
        revalidatePath('/admin');
        return { success: true, message: 'Leave request denied.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to deny leave request.' };
    }
}

export async function markAsUnpaidAction(requestId: string) {
    try {
        const docRef = doc(db, 'leaveRequests', requestId);
        await updateDoc(docRef, { leaveType: 'Unpaid' });
        revalidatePath('/admin');
        return { success: true, message: 'Leave marked as Unpaid.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to mark leave as Unpaid.' };
    }
}

export async function updateAttendanceForRangeAction(employeeId: string, from: Date, to: Date, worked: boolean) {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) {
        return { success: false, message: 'Employee not found.' };
    }
    const employee = employeeSnap.data();

    const rangeStart = startOfDay(from);
    const rangeEnd = endOfDay(to);

    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employee.name),
        where('clockIn', '>=', rangeStart),
        where('clockIn', '<=', rangeEnd)
    );
    const querySnapshot = await getDocs(q);

    if (worked) {
        const existingDays = new Set(querySnapshot.docs.map(d => startOfDay(d.data().clockIn.toDate()).getTime()));
        
        for (let day = rangeStart; day <= rangeEnd; day.setDate(day.getDate() + 1)) {
            if (!existingDays.has(day.getTime())) {
                const [startHour, startMinute] = employee.shiftStartTime.split(':').map(Number);
                const [endHour, endMinute] = employee.shiftEndTime.split(':').map(Number);
                
                const clockIn = new Date(day);
                clockIn.setHours(startHour, startMinute);

                const clockOut = new Date(day);
                clockOut.setHours(endHour, endMinute);

                await addDoc(collection(db, 'attendanceLogs'), {
                    employeeName: employee.name,
                    clockIn: clockIn,
                    clockOut: clockOut,
                });
            }
        }
        revalidatePath('/admin');
        return { success: true, message: 'Attendance added for the selected range.' };

    } else {
        const batch: any[] = [];
        querySnapshot.docs.forEach(d => {
            batch.push(deleteDoc(d.ref));
        });
        await Promise.all(batch);

        revalidatePath('/admin');
        return { success: true, message: 'Attendance removed for the selected range.' };
    }
}

export async function updateAttendanceForDayAction(employeeId: string, day: Date, worked: boolean) {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) {
        return { success: false, message: 'Employee not found.' };
    }
    const employee = employeeSnap.data();
    
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employee.name),
        where('clockIn', '>=', dayStart),
        where('clockIn', '<=', dayEnd)
    );
    const querySnapshot = await getDocs(q);
    const existingLog = querySnapshot.docs[0];

    if (worked) {
        if (existingLog) return { success: true, message: 'No change needed.' };
        
        const [startHour, startMinute] = employee.shiftStartTime.split(':').map(Number);
        const [endHour, endMinute] = employee.shiftEndTime.split(':').map(Number);
        
        const clockIn = new Date(day);
        clockIn.setHours(startHour, startMinute);

        const clockOut = new Date(day);
        clockOut.setHours(endHour, endMinute);

        await addDoc(collection(db, 'attendanceLogs'), {
            employeeName: employee.name,
            clockIn,
            clockOut,
        });
        revalidatePath('/admin');
        return { success: true, message: 'Attendance marked as worked.' };

    } else {
        if (!existingLog) return { success: true, message: 'No change needed.' };

        await deleteDoc(existingLog.ref);
        revalidatePath('/admin');
        return { success: true, message: 'Attendance marked as not worked.' };
    }
}
