
'use client';

import { useState, useEffect } from 'react';
import { EspressoTracker } from '@/components/espresso-tracker';
import { EspressoLog } from '@/components/espresso-log';
import { Skeleton } from '@/components/ui/skeleton';
import { getEmployees } from '@/services/client/attendance-service';
import { onEspressoLogsSnapshot } from '@/services/client/espresso-service';
import type { Employee, EspressoLog as EspressoLogType } from '@/lib/constants';

export default function EspressoTrackerPage() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [logs, setLogs] = useState<EspressoLogType[]>([]);

    useEffect(() => {
        let unsubscribeLogs: () => void;

        const initializePage = async () => {
            setLoading(true);
            try {
                const fetchedEmployees = await getEmployees();
                setEmployees(fetchedEmployees);

                unsubscribeLogs = onEspressoLogsSnapshot(setLogs, (err) => {
                    console.error("Failed to subscribe to espresso logs:", err);
                });
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        initializePage();

        return () => {
            unsubscribeLogs?.();
        };
    }, []);

    if (loading) {
        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold tracking-tight">Espresso Tracker</h2>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-[32rem] w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Espresso Tracker</h2>
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                    <EspressoTracker employees={employees} />
                </div>
                <div className="md:col-span-2">
                    <EspressoLog logs={logs} />
                </div>
            </div>
        </div>
    );
}
