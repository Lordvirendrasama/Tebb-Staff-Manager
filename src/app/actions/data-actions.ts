'use server';

import * as data from '@/lib/data';

export async function getAllDataAction() {
    try {
        const consumptionLogs = data.getConsumptionLogs();
        const attendanceLogs = data.getAttendanceLogs();
        const leaveRequests = data.getLeaveRequests();
        const employeeOfTheWeek = data.getEmployeeOfTheWeek();

        return {
            success: true,
            data: {
                consumptionLogs,
                attendanceLogs,
                leaveRequests,
                employeeOfTheWeek
            }
        };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to fetch data.' };
    }
}
