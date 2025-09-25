
'use client';

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { EspressoLog } from '@/lib/constants';

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


export const onEspressoLogsSnapshot = (
    callback: (logs: EspressoLog[]) => void,
    onError: (error: Error) => void
) => {
    const q = query(collection(db, 'espressoLogs'), orderBy('pullDateTime', 'desc'));
    return onSnapshot(q,
        (snapshot) => {
            const logs = snapshotToDocs<EspressoLog>(snapshot);
            callback(logs);
        },
        (error) => {
            console.error("Error listening to espresso logs collection:", error);
            onError(error);
        }
    );
};
