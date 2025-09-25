
'use server';

import { collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Employee, AttendanceLog, Payroll, PayFrequency } from '@/lib/constants';
import { differenceInHours, add, sub, isBefore, startOfDay, isSameDay } from 'date-fns';

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

function getPayPeriodForDate(payStartDate: Date, payFrequency: PayFrequency, targetDate: Date): { start: Date, end: Date } {
    let periodStart = startOfDay(payStartDate);

    while (true) {
        let periodEnd;
        switch (payFrequency) {
            case 'weekly':
                periodEnd = add(periodStart, { days: 6 });
                break;
            case 'bi-weekly':
                periodEnd = add(periodStart, { days: 13 });
                break;
            case 'monthly':
                periodEnd = add(periodStart, { months: 1 });
                periodEnd = sub(periodEnd, { days: 1 });
                break;
            default:
                throw new Error(`Unsupported pay frequency: ${payFrequency}`);
        }
        periodEnd = startOfDay(periodEnd);

        if (isBefore(targetDate, add(periodEnd, { days: 1 }))) {
            return { start: periodStart, end: periodEnd };
        }
        
        periodStart = add(periodEnd, { days: 1 });
    }
}


export async function generatePayrollForEmployee(employeeId: string, employeeName: string): Promise<Payroll | null> {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) throw new Error('Employee not found');

    const employee = await docToTyped<Employee>(employeeSnap);
    
    if (!employee.payStartDate || !employee.payFrequency || !employee.baseSalary) {
        throw new Error('Employee is missing required payroll configuration (start date, frequency, or salary).');
    }

    const { start: payPeriodStart, end: payPeriodEnd } = getPayPeriodForDate(employee.payStartDate, employee.payFrequency, new Date());
    
    const payrollQuery = query(
        collection(db, 'payroll'),
        where('employeeId', '==', employee.id)
    );
    const allPayrollsSnap = await getDocs(payrollQuery);
    const allPayrolls = await Promise.all(allPayrollsSnap.docs.map(d => docToTyped<Payroll>(d)));
    
    const existingPayroll = allPayrolls.find(p => isSameDay(p.payPeriodStart, payPeriodStart));

    if (existingPayroll) {
        throw new Error(`Payroll for this period already exists for ${employeeName}.`);
    }

    // WORKAROUND: Fetch all logs for the employee and then filter by date in code to avoid composite index.
    const attendanceQuery = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employee.name)
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const allAttendanceLogs = await Promise.all(
        attendanceSnapshot.docs.map(d => docToTyped<AttendanceLog>(d))
    );

    const periodEndWithTime = add(payPeriodEnd, {days: 1});
    const attendanceLogs = allAttendanceLogs.filter(log => 
        log.clockIn >= payPeriodStart && log.clockIn < periodEndWithTime
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

    const regularHours = totalHours - overtimeHours;
    let totalSalary;
    
    if (employee.payFrequency === 'monthly') {
        // Assuming baseSalary is monthly for monthly frequency
        const monthlyWorkHours = employee.standardWorkHours * 22; // Approximation
        const hourlyRate = monthlyWorkHours > 0 ? employee.baseSalary / monthlyWorkHours : 0;
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5;
        totalSalary = regularPay + overtimePay;
    } else {
        // Assuming baseSalary is hourly for weekly/bi-weekly
        const hourlyRate = employee.baseSalary;
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5;
        totalSalary = regularPay + overtimePay;
    }


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
