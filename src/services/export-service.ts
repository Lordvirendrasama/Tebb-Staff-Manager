
'use client';

import { collection, getDocs, orderBy } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { db } from '@/lib/firebase-client';
import { docsWithDates } from './attendance-service';
import type { Employee, ConsumptionLog, AttendanceLog, LeaveRequest } from '@/lib/constants';

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
    return docsWithDates<T>(snapshot);
}

export async function exportAllData() {
    // 1. Fetch all data concurrently
    const [employees, consumptionLogs, attendanceLogs, leaveRequests] = await Promise.all([
        fetchAllData<Employee>('employees'),
        fetchAllData<ConsumptionLog>('consumptionLogs', 'dateTimeLogged'),
        fetchAllData<AttendanceLog>('attendanceLogs', 'clockIn'),
        fetchAllData<LeaveRequest>('leaveRequests', 'startDate')
    ]);

    // 2. Define headers
    const employeeHeaders = ['id', 'name', 'weeklyOffDay', 'standardWorkHours'];
    const consumptionHeaders = ['id', 'employeeName', 'itemName', 'dateTimeLogged'];
    const attendanceHeaders = ['id', 'employeeName', 'clockIn', 'clockOut'];
    const leaveHeaders = ['id', 'employeeName', 'startDate', 'endDate', 'leaveType', 'status', 'reason'];

    // 3. Convert to CSV
    const employeesCSV = convertToCSV(employees, employeeHeaders);
    const consumptionCSV = convertToCSV(consumptionLogs, consumptionHeaders);
    const attendanceCSV = convertToCSV(attendanceLogs, attendanceHeaders);
    const leaveCSV = convertToCSV(leaveRequests, leaveHeaders);
    
    // 4. Save files
    saveAs(new Blob([employeesCSV], { type: 'text/csv;charset=utf-8' }), 'employees.csv');
    saveAs(new Blob([consumptionCSV], { type: 'text/csv;charset=utf-8' }), 'consumption_logs.csv');
    saveAs(new Blob([attendanceCSV], { type: 'text/csv;charset=utf-8' }), 'attendance_logs.csv');
    saveAs(new Blob([leaveCSV], { type: 'text/csv;charset=utf-8' }), 'leave_requests.csv');
}
