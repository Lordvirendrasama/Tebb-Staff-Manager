
'use server';

import { collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Employee, AttendanceLog, Payroll, PayFrequency } from '@/lib/constants';
import { differenceInHours, add, sub } from 'date-fns';

async function docToTyped<T>(docSnap: any): Promise<T> {
    const data = docSnap.data();
    if (!data) throw new Error('Document data is empty');
    
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

function getNextPayPeriod(payStartDate: Date, payFrequency: PayFrequency): { start: Date, end: Date } {
    const now = new Date();
    let currentStart = new Date(payStartDate.getTime());

    while (currentStart <= now) {
        let currentEnd;
        switch (payFrequency) {
            case 'weekly':
                currentEnd = add(currentStart, { days: 6 });
                break;
            case 'bi-weekly':
                currentEnd = add(currentStart, { days: 13 });
                break;
            case 'monthly':
                currentEnd = add(currentStart, { months: 1 });
                currentEnd = sub(currentEnd, {days: 1});
                break;
            default: // custom or fallback
                currentEnd = add(currentStart, { months: 1 });
                 currentEnd = sub(currentEnd, {days: 1});
        }
        if (now >= currentStart && now <= currentEnd) {
            return { start: currentStart, end: currentEnd };
        }
        currentStart = add(currentEnd, { days: 1 });
    }
    // Fallback if something goes wrong, should not happen in normal flow
    return { start: payStartDate, end: add(payStartDate, { days: 6 }) };
}


export async function generatePayrollForEmployee(employeeId: string, employeeName: string): Promise<Payroll | null> {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) throw new Error('Employee not found');

    const employee = await docToTyped<Employee>(employeeSnap);
    
    if (!employee.payStartDate || !employee.payFrequency || !employee.baseSalary) {
        throw new Error('Employee is missing required payroll configuration (start date, frequency, or salary).');
    }

    const { start: payPeriodStart, end: payPeriodEnd } = getNextPayPeriod(employee.payStartDate, employee.payFrequency);
    
    // Check if payroll for this period already exists
    const payrollQuery = query(
        collection(db, 'payroll'),
        where('employeeId', '==', employee.id),
        where('payPeriodStart', '==', payPeriodStart),
    );
    const existingPayrollSnap = await getDocs(payrollQuery);
    if(!existingPayrollSnap.empty) {
        throw new Error(`Payroll for this period already exists for ${employeeName}.`);
    }


    const attendanceQuery = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employee.name),
        where('clockIn', '>=', payPeriodStart),
        where('clockIn', '<=', payPeriodEnd)
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceLogs = await Promise.all(
        attendanceSnapshot.docs.map(d => docToTyped<AttendanceLog>(d))
    );

    let totalHours = 0;
    let overtimeHours = 0;

    attendanceLogs.forEach(log => {
        if (log.clockOut) {
            const hours = differenceInHours(log.clockOut, log.clockIn);
            totalHours += hours;
            const overtime = Math.max(0, hours - employee.standardWorkHours);
            overtimeHours += overtime;
        }
    });

    // Simple salary calculation logic
    const hourlyRate = employee.payFrequency === 'monthly' ? employee.baseSalary / 160 : employee.baseSalary;
    const regularHours = totalHours - overtimeHours;
    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const totalSalary = regularPay + overtimePay;

    const newPayroll: Omit<Payroll, 'id'> = {
        employeeId: employee.id,
        employeeName: employee.name,
        payPeriodStart,
        payPeriodEnd,
        baseSalary: employee.baseSalary,
        hoursWorked: totalHours,
        overtimeHours,
        totalSalary,
        status: 'pending',
        generatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'payroll'), newPayroll);

    return { id: docRef.id, ...newPayroll };
}
