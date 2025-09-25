
'use server';

import { collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Employee, AttendanceLog, Payroll, PayFrequency, WeekDay } from '@/lib/constants';
import { differenceInHours, add, sub, isBefore, startOfDay, isSameDay, eachDayOfInterval } from 'date-fns';

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

const getWeekDayNumber = (day: WeekDay): number => {
    const dayMap: { [key in WeekDay]: number } = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    return dayMap[day];
};

export async function generatePayrollForEmployee(employeeId: string, employeeName: string): Promise<Payroll | null> {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) throw new Error('Employee not found');

    const employee = await docToTyped<Employee>(employeeSnap);
    
    if (!employee.payStartDate || !employee.payFrequency || !employee.monthlySalary || !employee.shiftStartTime) {
        throw new Error('Employee is missing required payroll configuration (start date, frequency, salary, or shift start time).');
    }

    const { start: payPeriodStart, end: payPeriodEnd } = getPayPeriodForDate(employee.payStartDate, employee.payFrequency, new Date());
    
    const payrollQuery = query(collection(db, 'payroll'), where('employeeId', '==', employee.id));
    const allPayrollsSnap = await getDocs(payrollQuery);
    const allPayrolls = await Promise.all(allPayrollsSnap.docs.map(d => docToTyped<Payroll>(d)));
    
    const existingPayroll = allPayrolls.find(p => isSameDay(p.payPeriodStart, payPeriodStart));
    if (existingPayroll) {
        throw new Error(`Payroll for this period already exists for ${employeeName}.`);
    }

    // --- New Pro-Rata Logic ---

    // 1. Calculate Total Working Days in Period
    const payPeriodDays = eachDayOfInterval({ start: payPeriodStart, end: payPeriodEnd });
    const weeklyOffDayNumber = getWeekDayNumber(employee.weeklyOffDay);
    const totalWorkingDays = payPeriodDays.filter(day => day.getDay() !== weeklyOffDayNumber).length;
    if (totalWorkingDays <= 0) throw new Error("No working days in this pay period.");

    const perDaySalary = employee.monthlySalary / totalWorkingDays;

    // 2. Fetch Attendance Logs for the period
    const attendanceQuery = query(collection(db, 'attendanceLogs'), where('employeeName', '==', employee.name));
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const allAttendanceLogs = await Promise.all(attendanceSnapshot.docs.map(d => docToTyped<AttendanceLog>(d)));
    
    const periodEndWithTime = add(payPeriodEnd, { days: 1 });
    const attendanceLogsInPeriod = allAttendanceLogs.filter(log => 
        log.clockIn >= payPeriodStart && log.clockIn < periodEndWithTime && log.clockOut
    );

    // 3. Calculate Actual Days Worked & Late Days
    const workedDays = new Map<string, { clockIn: Date, hours: number }>();
    attendanceLogsInPeriod.forEach(log => {
        const dayKey = format(log.clockIn, 'yyyy-MM-dd');
        const hoursWorked = differenceInHours(log.clockOut!, log.clockIn);
        
        // Store only the earliest clock-in for the day
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
    
    // 4. Calculate Final Salary
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
