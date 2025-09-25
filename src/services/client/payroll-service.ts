
'use client';

import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Payroll } from '@/lib/constants';

function snapshotToDocs<T>(snapshot: any): T[] {
    if (!snapshot.docs) return [];
    return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const convertedData: { [key: string]: any } = { id: doc.id };
        for (const key in data) {
            const value = data[key];
            if (value && typeof value.toDate === 'function') {
                convertedData[key] = value.toDate();
            } else {
                convertedData[key] = value;
            }
        }
        return convertedData as T;
    });
}

export const onPayrollSnapshot = (
    callback: (payrolls: Payroll[]) => void,
    onError: (error: Error) => void
) => {
    const q = query(collection(db, 'payroll'), orderBy('payPeriodStart', 'desc'));
    return onSnapshot(q, 
        (snapshot) => {
            const payrolls = snapshotToDocs<Payroll>(snapshot);
            callback(payrolls);
        },
        (error) => {
            console.error("Error listening to payroll collection:", error);
            onError(error);
        }
    );
};

export const onUserPayrollSnapshot = (
    userName: string,
    callback: (payrolls: Payroll[]) => void,
    onError: (error: Error) => void
) => {
    const q = query(
        collection(db, 'payroll'),
        where('employeeName', '==', userName),
        orderBy('payPeriodStart', 'desc')
    );
    return onSnapshot(q, 
        (snapshot) => {
            const payrolls = snapshotToDocs<Payroll>(snapshot);
            callback(payrolls);
        },
        onError
    );
};
