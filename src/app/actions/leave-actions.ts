
'use server';

import type { LeaveRequest, LeaveStatus, User } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export async function addLeaveRequestAction(requestData: Omit<LeaveRequest, 'id' | 'status'>) {
    try {
        await addDoc(collection(db, 'leaveRequests'), {
            ...requestData,
            startDate: new Date(requestData.startDate),
            endDate: new Date(requestData.endDate),
            status: 'Pending',
        });
        revalidatePath('/admin');
        return { success: true, message: 'Leave request added successfully.' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to add leave request: ${errorMessage}` };
    }
}

export async function getLeaveRequestsAction(): Promise<LeaveRequest[]> {
    try {
        const q = query(collection(db, 'leaveRequests'), orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            startDate: d.data().startDate.toDate(),
            endDate: d.data().endDate.toDate(),
        } as LeaveRequest));
        return requests;
    } catch (error) {
        console.error("Failed to fetch leave requests", error);
        return [];
    }
}

export async function updateLeaveStatusAction(id: string, status: LeaveStatus) {
    try {
        await updateDoc(doc(db, 'leaveRequests', id), { status });
        revalidatePath('/admin');
        return { success: true, message: `Leave request status updated to ${status}.` };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to update status: ${errorMessage}` };
    }
}


export async function deleteLeaveRequestAction(id: string) {
    try {
        await deleteDoc(doc(db, 'leaveRequests', id));
        revalidatePath('/admin');
        return { success: true, message: 'Leave request deleted.' };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to delete request: ${errorMessage}` };
    }
}
