
'use client';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { db } from '@/lib/firebase-client';
import type { Employee, ConsumptionLog, AttendanceLog, EspressoLog, ConsumableItemDef } from '@/lib/constants';
import { format } from 'date-fns';
import { getAllUsers } from '@/app/actions/admin-actions';

async function fetchAllData<T>(collectionName: string, dateField?: string): Promise<T[]> {
    const collRef = collection(db, collectionName);
    const q = dateField ? query(collRef, orderBy(dateField, 'desc')) : query(collRef);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const convertedData: { [key: string]: any } = { id: doc.id };
        for (const key in data) {
            const value = data[key];
            if (value && typeof value.toDate === 'function') {
                // Keep as Date object for JSON stringification to ISO format
                convertedData[key] = value.toDate();
            } else {
                convertedData[key] = value;
            }
        }
        return convertedData as T;
    });
}

function convertToCSV(data: any[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map(item => {
        return headers.map(header => {
            const value = item[header as keyof typeof item];
            if (value === undefined || value === null) {
                return '';
            }
            let stringValue = '';
            if (value instanceof Date) {
                stringValue = format(value, 'yyyy-MM-dd HH:mm:ss');
            } else {
                stringValue = String(value);
            }
            
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
}

export async function exportEmployeeDetails() {
    const employees = await getAllUsers();
    const headers = ['id', 'name', 'weeklyOffDay', 'standardWorkHours', 'shiftStartTime', 'shiftEndTime', 'monthlySalary', 'payFrequency', 'payStartDate'];
    const csv = convertToCSV(employees, headers);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'employee_details.csv');
}

export async function exportAttendanceLogs() {
    const attendanceLogs = await fetchAllData<AttendanceLog>('attendanceLogs', 'clockIn');
    const headers = ['id', 'employeeName', 'clockIn', 'clockOut'];
    const csv = convertToCSV(attendanceLogs, headers);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'attendance_logs.csv');
}

export async function exportConsumptionLogs() {
    const consumptionLogs = await fetchAllData<ConsumptionLog>('consumptionLogs', 'dateTimeLogged');
    const headers = ['employeeName', 'itemName', 'dateTimeLogged'];
    const csv = convertToCSV(consumptionLogs, headers);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'consumption_logs.csv');
}

export async function exportEspressoData() {
    const espressoLogs = await fetchAllData<EspressoLog>('espressoLogs', 'pullDateTime');
    const headers = ['id', 'employeeName', 'coffeeType', 'timeTaken', 'coffeeUsed', 'groupHead', 'pullDateTime'];
    const csv = convertToCSV(espressoLogs, headers);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'espresso_logs.csv');
}

export async function exportMasterReport() {
    const [
        employees,
        consumptionLogs,
        attendanceLogs,
        espressoLogs,
        consumableItems,
    ] = await Promise.all([
        fetchAllData<Employee>('employees'),
        fetchAllData<ConsumptionLog>('consumptionLogs', 'dateTimeLogged'),
        fetchAllData<AttendanceLog>('attendanceLogs', 'clockIn'),
        fetchAllData<EspressoLog>('espressoLogs', 'pullDateTime'),
        fetchAllData<ConsumableItemDef>('consumableItems'),
    ]);

    const backupData = {
        employees,
        consumptionLogs,
        attendanceLogs,
        espressoLogs,
        consumableItems,
    };
    
    const json = JSON.stringify(backupData, null, 2);
    saveAs(new Blob([json], { type: 'application/json;charset=utf-8' }), `8bitbistro_backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
}
