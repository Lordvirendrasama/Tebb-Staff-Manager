
'use server';

import type { User, LeaveType } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { getAttendanceStatus } from '@/services/attendance-service';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { startOfDay, endOfDay, isWithinInterval, isBefore, setHours, setMinutes, setSeconds, setMilliseconds, addDays } from 'date-fns';


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

                let clockOut = new Date(day);
                clockOut.setHours(endHour, endMinute);
                
                if (isBefore(clockOut, clockIn)) {
                    clockOut = addDays(clockOut, 1);
                }

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

export async function updateAttendanceForDayAction(
    employeeId: string, 
    day: Date, 
    worked: boolean,
    clockInTime?: string,
    clockOutTime?: string
) {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) {
        return { success: false, message: 'Employee not found.' };
    }
    const employee = employeeSnap.data();
    
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    // Query just by employee name
    const q = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employee.name)
    );
    const querySnapshot = await getDocs(q);

    // Filter by date in the code
    const existingLog = querySnapshot.docs.find(d => {
        const clockInDate = d.data().clockIn.toDate();
        return isWithinInterval(clockInDate, { start: dayStart, end: dayEnd });
    });

    if (worked) {
        let clockIn: Date;
        let clockOut: Date;

        if (clockInTime && clockOutTime) {
            const [inHours, inMinutes] = clockInTime.split(':').map(Number);
            clockIn = setSeconds(setMinutes(setHours(day, inHours), inMinutes), 0);

            const [outHours, outMinutes] = clockOutTime.split(':').map(Number);
            clockOut = setSeconds(setMinutes(setHours(day, outHours), outMinutes), 0);
        } else {
            const [startHour, startMinute] = employee.shiftStartTime.split(':').map(Number);
            const [endHour, endMinute] = employee.shiftEndTime.split(':').map(Number);
            
            clockIn = setHours(new Date(day), startHour, startMinute);
            clockOut = setHours(new Date(day), endHour, endMinute);
        }

        if (isBefore(clockOut, clockIn)) {
            clockOut = addDays(clockOut, 1);
        }
        
        if (existingLog) {
            await updateDoc(existingLog.ref, { clockIn, clockOut });
        } else {
            await addDoc(collection(db, 'attendanceLogs'), {
                employeeName: employee.name,
                clockIn,
                clockOut,
            });
        }
        revalidatePath('/admin');
        return { success: true, message: 'Attendance marked as worked.' };

    } else {
        if (!existingLog) return { success: true, message: 'No change needed.' };

        await deleteDoc(existingLog.ref);
        revalidatePath('/admin');
        return { success: true, message: 'Attendance marked as not worked.' };
    }
}


export async function updateAttendanceTimesAction(logId: string, clockInTime: string, clockOutTime: string) {
    try {
        const logRef = doc(db, 'attendanceLogs', logId);
        const logSnap = await getDoc(logRef);
        if (!logSnap.exists()) {
            return { success: false, message: 'Attendance log not found.' };
        }

        const originalClockIn = logSnap.data().clockIn.toDate();

        const [inHours, inMinutes] = clockInTime.split(':').map(Number);
        const newClockIn = setSeconds(setMinutes(setHours(new Date(originalClockIn), inHours), inMinutes), 0);
        
        const [outHours, outMinutes] = clockOutTime.split(':').map(Number);
        // Use a clean date object for clockOut to avoid mutation issues
        let newClockOut = setSeconds(setMinutes(setHours(new Date(originalClockIn), outHours), outMinutes), 0);
        
        // If clock out time is earlier than clock in, it must be the next day
        if (isBefore(newClockOut, newClockIn)) {
            newClockOut = addDays(newClockOut, 1);
        }

        await updateDoc(logRef, {
            clockIn: newClockIn,
            clockOut: newClockOut,
        });

        revalidatePath('/admin');
        revalidatePath(`/dashboard/${logSnap.data().employeeName}`);
        return { success: true, message: 'Attendance times updated successfully.' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to update attendance: ${errorMessage}` };
    }
}
