
'use server';

import type { Payroll } from '@/lib/constants';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { revalidatePath } from 'next/cache';


export async function getPayrollDataAction(): Promise<Payroll[]> {
    const q = query(collection(db, 'payroll'), orderBy('payPeriodStart', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    const payrolls = snapshot.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            employeeName: data.employeeName,
            payPeriodStart: data.payPeriodStart.toDate(),
            payPeriodEnd: data.payPeriodEnd.toDate(),
            amount: data.amount,
            status: data.status,
        } as Payroll;
    });
    return payrolls;
}
