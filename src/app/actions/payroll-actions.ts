
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { generatePayrollForEmployee } from '@/services/payroll-service';

export async function generatePayrollAction(employeeId: string, employeeName: string) {
    try {
        await generatePayrollForEmployee(employeeId, employeeName);
        revalidatePath('/admin');
        return { success: true, message: `Payroll generated successfully for ${employeeName}.` };
    } catch (error) {
        console.error('Failed to generate payroll:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to generate payroll: ${errorMessage}` };
    }
}

export async function markPayrollAsPaidAction(payrollId: string) {
    try {
        const payrollRef = doc(db, 'payroll', payrollId);
        await updateDoc(payrollRef, {
            status: 'paid',
            paymentDate: new Date(),
        });
        revalidatePath('/admin');
        return { success: true, message: 'Payroll marked as paid.' };
    } catch (error) {
        console.error('Failed to mark payroll as paid:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to update payroll: ${errorMessage}` };
    }
}

export async function updatePayrollAction(payrollId: string, data: { tips?: number; deductions?: number }) {
     try {
        const payrollRef = doc(db, 'payroll', payrollId);
        await updateDoc(payrollRef, data);
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true, message: 'Payroll updated.' };
    } catch (error) {
        console.error('Failed to update payroll:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to update payroll: ${errorMessage}` };
    }
}

export async function deletePayrollAction(payrollId: string) {
    try {
        await deleteDoc(doc(db, 'payroll', payrollId));
        revalidatePath('/admin');
        return { success: true, message: 'Payroll record deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete payroll:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete payroll: ${errorMessage}` };
    }
}
