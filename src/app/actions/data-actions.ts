
'use server';

import * as data from '@/lib/data';
import type { Database } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function getAllDataAction() {
    try {
        const {
            consumptionLogs,
            attendanceLogs,
            employeeOfTheWeek
        } = await data.getAllData();

        return {
            success: true,
            data: {
                consumptionLogs: consumptionLogs.map(log => ({...log, dateTimeLogged: log.dateTimeLogged.toISOString()})),
                attendanceLogs: attendanceLogs.map(log => ({...log, clockIn: log.clockIn.toISOString(), clockOut: log.clockOut?.toISOString()})),
                employeeOfTheWeek
            }
        };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to fetch data from the local file.' };
    }
}

export async function importDataAction(db: Database) {
    try {
        // We need to convert date strings back to Date objects
        const sanitizedDb: Database = {
            consumptionLogs: db.consumptionLogs.map(log => ({...log, dateTimeLogged: new Date(log.dateTimeLogged) })),
            attendanceLogs: db.attendanceLogs.map(log => ({...log, clockIn: new Date(log.clockIn), clockOut: log.clockOut ? new Date(log.clockOut) : undefined })),
            employeeOfTheWeek: db.employeeOfTheWeek,
            employees: db.employees,
        }
        data.writeDb(sanitizedDb);
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath('/dashboard/Abbas');
        revalidatePath('/dashboard/Musaib');
        return { success: true, message: 'Data imported successfully!' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to import data.' };
    }
}
