
'use client';

import * as serverService from '../consumption-log-service';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { startOfMonth, endOfMonth } from 'date-fns';

// This file exports server functions for client-side use.
// This is the correct way to expose server functions to client components
// without marking the entire service file as a client module.

export const getLogsForUser = serverService.getLogsForUser;
export const getRemainingAllowances = serverService.getRemainingAllowances;
export const getAllUsersAllowances = serverService.getAllUsersAllowances;

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
