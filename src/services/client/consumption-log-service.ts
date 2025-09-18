
'use client';

import * as serverService from '../consumption-log-service';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { ConsumptionLog, User } from '@/lib/constants';

// This file exports server functions for client-side use.
// This is the correct way to expose server functions to client components
// without marking the entire service file as a client module.

export const getLogsForUser = serverService.getLogsForUser;
export const getRemainingAllowances = serverService.getRemainingAllowances;
export const getAllUsersAllowances = serverService.getAllUsersAllowances;

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


export const onConsumptionLogsSnapshot = (
    callback: (allowances: any[]) => void,
    onError: (error: Error) => void
) => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const q = query(
        collection(db, 'consumptionLogs'),
        where('dateTimeLogged', '>=', start),
        where('dateTimeLogged', '<=', end)
    );

    return onSnapshot(q, async () => {
        try {
            const allowances = await serverService.getAllUsersAllowances();
            callback(allowances);
        } catch (error: any) {
            onError(error);
        }
    }, onError);
};

export const onUserConsumptionLogsSnapshot = (
    user: User,
    callback: (logs: ConsumptionLog[]) => void,
    onError: (error: Error) => void
) => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const q = query(
        collection(db, 'consumptionLogs'),
        where('employeeName', '==', user),
        where('dateTimeLogged', '>=', start),
        where('dateTimeLogged', '<=', end),
        orderBy('dateTimeLogged', 'desc')
    );

    return onSnapshot(q, 
        (snapshot) => {
            const logs = snapshotToDocs<ConsumptionLog>(snapshot);
            callback(logs);
        },
        onError
    );
};
