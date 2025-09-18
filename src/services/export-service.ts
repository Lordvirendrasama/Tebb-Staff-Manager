
'use client';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { db } from '@/lib/firebase-client';
import type { Employee, ConsumptionLog, AttendanceLog, LeaveRequest, User } from '@/lib/constants';
import { differenceInHours, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { getMonthlyOvertime, getEmployees, getAllLeaveRequests } from './client/attendance-service';
import { getAllUsersAllowances } from './client/consumption-log-service';

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
    const [
        employees,
        consumptionLogs,
        attendanceLogs,
        leaveRequests,
        overtimeData,
        allowanceData
    ] = await Promise.all([
        getEmployees(),
        fetchAllData<ConsumptionLog>('consumptionLogs', 'dateTimeLogged'),
        fetchAllData<AttendanceLog>('attendanceLogs', 'clockIn'),
        getAllLeaveRequests(),
        getMonthlyOvertime(),
        getAllUsersAllowances(),
    ]);

    const overtimeMap = new Map(overtimeData.map(o => [o.name, o.overtime]));
    const allowanceMap = new Map(allowanceData.map(a => [a.user, a.allowances]));
    const employeeMap = new Map(employees.map(e => [e.name, e]));

    const masterData: any[] = [];
    const today = new Date();
    const dateRange = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });

    for (const employee of employees) {
        for (const date of dateRange) {
            const formattedDate = format(date, 'yyyy-MM-dd');

            const attendanceForDay = attendanceLogs.filter(log => 
                log.employeeName === employee.name && isSameDay(new Date(log.clockIn), date)
            );
            
            const consumptionForDay = consumptionLogs.filter(log => 
                log.employeeName === employee.name && isSameDay(new Date(log.dateTimeLogged), date)
            );

            const leaveForDay = leaveRequests.find(req => 
                req.employeeName === employee.name && 
                req.status === 'Approved' &&
                date >= new Date(req.startDate) && date <= new Date(req.endDate)
            );

            let hoursWorked = 0;
            let overtimeToday = 0;
            if (attendanceForDay.length > 0 && attendanceForDay[0].clockOut) {
                hoursWorked = differenceInHours(new Date(attendanceForDay[0].clockOut), new Date(attendanceForDay[0].clockIn));
                overtimeToday = Math.max(0, hoursWorked - employee.standardWorkHours);
            }
            
            const clockInTime = attendanceForDay.length > 0 ? format(new Date(attendanceForDay[0].clockIn), 'HH:mm:ss') : '';
            const clockOutTime = attendanceForDay.length > 0 && attendanceForDay[0].clockOut ? format(new Date(attendanceForDay[0].clockOut), 'HH:mm:ss') : '';


            const itemsConsumed = consumptionForDay.map(log => log.itemName).join('; ');
            const monthlyOvertime = overtimeMap.get(employee.name) || 0;
            const allowances = allowanceMap.get(employee.name);

            masterData.push({
                Date: formattedDate,
                EmployeeName: employee.name,
                ClockIn: clockInTime,
                ClockOut: clockOutTime,
                HoursWorked: hoursWorked > 0 ? hoursWorked : '',
                OvertimeToday: overtimeToday > 0 ? overtimeToday : '',
                LeaveStatus: leaveForDay ? 'On Leave' : '',
                LeaveType: leaveForDay ? leaveForDay.leaveType : '',
                ItemsConsumed: itemsConsumed,
                MonthlyOvertimeTotal: monthlyOvertime,
                MonthlyAllowanceDrinksRemaining: allowances?.drinks ?? '',
                MonthlyAllowanceMealsRemaining: allowances?.meals ?? '',
            });
        }
    }

    const masterHeaders = [
        'Date', 'EmployeeName', 'ClockIn', 'ClockOut', 'HoursWorked', 
        'OvertimeToday', 'LeaveStatus', 'LeaveType', 'ItemsConsumed',
        'MonthlyOvertimeTotal', 'MonthlyAllowanceDrinksRemaining', 'MonthlyAllowanceMealsRemaining'
    ];

    const masterCSV = convertToCSV(masterData, masterHeaders);
    
    saveAs(new Blob([masterCSV], { type: 'text/csv;charset=utf-8' }), 'master_export.csv');
}
