
'use server';

import { collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Employee, AttendanceLog, Payroll, PayFrequency, WeekDay } from '@/lib/constants';
import { differenceInHours, add, sub, isBefore, startOfDay, isSameDay, eachDayOfInterval, format, getMonth, getYear, getDate, addMonths, subMonths, isAfter } from 'date-fns';

const LATE_DEDUCTION_AMOUNT = 50;
const LATE_BUFFER_MINUTES = 10;

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

function getPayPeriodForDate(payStartDate: Date, payFrequency: PayFrequency, forDate: Date): { start: Date, end: Date } {
    if (payFrequency === 'monthly') {
        let periodStart;
        const cycleDay = getDate(payStartDate);

        // Find the cycle start date for the month of `forDate`
        let cycleStartDateForTargetMonth = new Date(getYear(forDate), getMonth(forDate), cycleDay);

        if (isAfter(forDate, cycleStartDateForTargetMonth)) {
             // If forDate is on or after the cycle day of this month, this is the start of the period
             periodStart = cycleStartDateForTargetMonth;
        } else {
            // Otherwise, the pay period started in the previous month
            periodStart = subMonths(cycleStartDateForTargetMonth, 1);
        }
        
        const periodEnd = sub(addMonths(periodStart, 1), { days: 1 });
        return { start: startOfDay(periodStart), end: startOfDay(periodEnd) };
    }

    // Fallback for weekly/bi-weekly (existing logic)
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
            default: // Should not happen with the monthly check above, but as a safeguard
                 periodEnd = add(periodStart, { months: 1 });
                 periodEnd = sub(periodEnd, { days: 1 });
        }
        periodEnd = startOfDay(periodEnd);

        if (isBefore(forDate, add(periodEnd, { days: 1 }))) {
            return { start: periodStart, end: periodEnd };
        }
        
        periodStart = add(periodEnd, { days: 1 });
    }
}


const getWeekDayNumber = (day: WeekDay): number => {
    const dayMap: { [key in WeekDay]: number } = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    return dayMap[day];
};

export async function generatePayrollForEmployee(employeeId: string, employeeName: string, generationDate: Date = new Date()): Promise<Payroll | null> {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) throw new Error('Employee not found');

    const employee = await docToTyped<Employee>(employeeSnap);
    
    if (!employee.payStartDate || !employee.payFrequency || !employee.monthlySalary || !employee.shiftStartTime) {
        throw new Error('Employee is missing required payroll configuration (start date, frequency, salary, or shift start time).');
    }

    const { start: payPeriodStart, end: payPeriodEnd } = getPayPeriodForDate(employee.payStartDate, employee.payFrequency, generationDate);
    
    const payrollQuery = query(
        collection(db, 'payroll'), 
        where('employeeId', '==', employee.id)
    );

    const allPayrollsSnap = await getDocs(payrollQuery);
    const allPayrolls = await Promise.all(allPayrollsSnap.docs.map(d => docToTyped<Payroll>(d)));
    
    const existingPayroll = allPayrolls.find(p => isSameDay(new Date(p.payPeriodStart), payPeriodStart));
    if (existingPayroll) {
        throw new Error(`Payroll for this period (${format(payPeriodStart, 'MMM d')} - ${format(payPeriodEnd, 'MMM d')}) already exists for ${employeeName}.`);
    }

    const payPeriodDays = eachDayOfInterval({ start: payPeriodStart, end: payPeriodEnd });
    const weeklyOffDayNumber = getWeekDayNumber(employee.weeklyOffDay);
    const totalWorkingDays = payPeriodDays.filter(day => day.getDay() !== weeklyOffDayNumber).length;
    if (totalWorkingDays <= 0) throw new Error("No working days in this pay period.");

    const perDaySalary = employee.monthlySalary / totalWorkingDays;

    const attendanceQuery = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employee.name),
        where('clockIn', '>=', payPeriodStart),
        where('clockIn', '<', add(payPeriodEnd, { days: 1 }))
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceLogsInPeriod = await Promise.all(attendanceSnapshot.docs.map(d => docToTyped<AttendanceLog>(d)));
    
    const workedDays = new Map<string, { clockIn: Date, hours: number }>();
    attendanceLogsInPeriod.forEach(log => {
        if (!log.clockOut) return;
        const dayKey = format(log.clockIn, 'yyyy-MM-dd');
        const hoursWorked = differenceInHours(log.clockOut!, log.clockIn);
        
        if (!workedDays.has(dayKey) || log.clockIn < workedDays.get(dayKey)!.clockIn) {
            workedDays.set(dayKey, { clockIn: log.clockIn, hours: hoursWorked });
        }
    });

    const actualDaysWorked = workedDays.size;
    
    let lateDays = 0;
    const [shiftHour, shiftMinute] = employee.shiftStartTime.split(':').map(Number);

    workedDays.forEach(({ clockIn }) => {
        const shiftStartToday = new Date(clockIn);
        shiftStartToday.setHours(shiftHour, shiftMinute, 0, 0);
        
        const lateBuffer = add(shiftStartToday, { minutes: LATE_BUFFER_MINUTES });
        
        if (clockIn > lateBuffer) {
            lateDays++;
        }
    });

    const lateDeductions = lateDays * LATE_DEDUCTION_AMOUNT;
    
    const baseSalaryForDaysWorked = perDaySalary * actualDaysWorked;
    const finalSalary = baseSalaryForDaysWorked - lateDeductions;
    
    const newPayroll: Omit<Payroll, 'id'> = {
        employeeId: employee.id,
        employeeName: employee.name,
        payPeriodStart,
        payPeriodEnd,
        monthlySalary: employee.monthlySalary,
        totalWorkingDays,
        actualDaysWorked,
        perDaySalary,
        lateDays,
        lateDeductions,
        finalSalary: finalSalary,
        status: 'pending',
        generatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'payroll'), newPayroll);

    return { id: docRef.id, ...newPayroll };
}
