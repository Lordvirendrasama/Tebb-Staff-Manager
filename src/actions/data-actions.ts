'use server';

import * as data from '@/lib/data';

export async function getAllDataAction() {
    try {
        const {
            consumptionLogs,
            attendanceLogs,
            leaveRequests,
            employeeOfTheWeek
        } = await data.getAllData();

        return {
            success: true,
            data: {
                consumptionLogs: consumptionLogs.map(log => ({...log, dateTimeLogged: log.dateTimeLogged.toISOString()})),
                attendanceLogs: attendanceLogs.map(log => ({...log, clockIn: log.clockIn.toISOString(), clockOut: log.clockOut?.toISOString()})),
                leaveRequests: leaveRequests.map(req => ({...req, leaveDate: req.leaveDate.toISOString()})),
                employeeOfTheWeek
            }
        };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to fetch data from the local file.' };
    }
}
