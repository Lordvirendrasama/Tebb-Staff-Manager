
'use client';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { db } from '@/lib/firebase-client';
import type { Employee, ConsumptionLog, AttendanceLog, LeaveRequest } from '@/lib/constants';
import { differenceInHours } from 'date-fns';
import { getAllUsersAllowances, getMonthlyOvertime } from './client/attendance-service';

async function docWithDates<T>(docSnap: any): Promise<T> {
    const data = docSnap.data();
    if (!data) {
        throw new Error('Document data is empty');
    }
    
    const convertedData: { [key: string]: any } = { id: docSnap.id };
    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
            convertedData[key] = value.toDate();
        } else {
            convertedData[key] = value;
        }
    }
    return convertedData as T;
}


function convertToCSV(data: any[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map(item => {
        return headers.map(header => {
            const value = item[header as keyof typeof item];
            if (value === undefined || value === null) {
                return '';
            }
            const stringValue = String(value);
            // Escape commas and quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
}

async function fetchAllData<T>(collectionName: string, dateField?: string): Promise<T[]> {
    const collRef = collection(db, collectionName);
    const q = dateField ? query(collRef, orderBy(dateField, 'desc')) : query(collRef);
    const snapshot = await getDocs(q);
    return Promise.all(snapshot.docs.map(doc => docWithDates<T>(doc)));
}

export async function exportAllData() {
    // 1. Fetch all data concurrently
    const [
        employees,
        consumptionLogs,
        attendanceLogs,
        leaveRequests,
        overtimeData,
        allowanceData
    ] = await Promise.all([
        fetchAllData<Employee>('employees'),
        fetchAllData<ConsumptionLog>('consumptionLogs', 'dateTimeLogged'),
        fetchAllData<AttendanceLog>('attendanceLogs', 'clockIn'),
        fetchAllData<LeaveRequest>('leaveRequests', 'startDate'),
        getMonthlyOvertime(),
        getAllUsersAllowances(),
    ]);

    // 2. Process attendance logs to add hours worked
    const processedAttendanceLogs = attendanceLogs.map(log => {
        let hoursWorked = 0;
        if (log.clockIn && log.clockOut) {
            hoursWorked = differenceInHours(new Date(log.clockOut), new Date(log.clockIn));
        }
        return { ...log, hoursWorked };
    });

    // 3. Define headers
    const employeeHeaders = ['id', 'name', 'weeklyOffDay', 'standardWorkHours'];
    const consumptionHeaders = ['id', 'employeeName', 'itemName', 'dateTimeLogged'];
    const attendanceHeaders = ['id', 'employeeName', 'clockIn', 'clockOut', 'hoursWorked'];
    const leaveHeaders = ['id', 'employeeName', 'startDate', 'endDate', 'leaveType', 'status', 'reason'];
    const overtimeHeaders = ['name', 'overtime'];
    const allowanceHeaders = ['user', 'drinks', 'meals'];

    // 4. Convert to CSV
    const employeesCSV = convertToCSV(employees, employeeHeaders);
    const consumptionCSV = convertToCSV(consumptionLogs, consumptionHeaders);
    const attendanceCSV = convertToCSV(processedAttendanceLogs, attendanceHeaders);
    const leaveCSV = convertToCSV(leaveRequests, leaveHeaders);
    const overtimeCSV = convertToCSV(overtimeData, overtimeHeaders);
    
    const flattenedAllowanceData = allowanceData.map(item => ({
        user: item.user,
        drinks: item.allowances.drinks,
        meals: item.allowances.meals
    }));
    const allowancesCSV = convertToCSV(flattenedAllowanceData, allowanceHeaders);
    
    // 5. Save files
    saveAs(new Blob([employeesCSV], { type: 'text/csv;charset=utf-8' }), 'employees.csv');
    saveAs(new Blob([consumptionCSV], { type: 'text/csv;charset=utf-8' }), 'consumption_logs.csv');
    saveAs(new Blob([attendanceCSV], { type: 'text/csv;charset=utf-8' }), 'attendance_logs.csv');
    saveAs(new Blob([leaveCSV], { type: 'text/csv;charset-utf-8' }), 'leave_requests.csv');
    saveAs(new Blob([overtimeCSV], { type: 'text/csv;charset=utf-8' }), 'monthly_overtime.csv');
    saveAs(new Blob([allowancesCSV], { type: 'text/csv;charset=utf-8' }), 'monthly_allowances.csv');
}
