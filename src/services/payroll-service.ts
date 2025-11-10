
'use server';

import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Employee, AttendanceLog, Payroll, PayFrequency, WeekDay } from '@/lib/constants';
import { differenceInHours, add, startOfDay, isSameDay, eachDayOfInterval, format, isAfter, getYear, getMonth, getDate } from 'date-fns';

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

const getWeekDayNumber = (day: WeekDay): number => {
    const dayMap: { [key in WeekDay]: number } = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    return dayMap[day];
};

async function getLeaveDaysForPeriod(employeeName: string, start: Date, end: Date): Promise<number> {
    const leaveQuery = query(
        collection(db, 'leaveRequests'),
        where('employeeName', '==', employeeName),
        where('status', '==', 'Approved')
    );
    const leaveSnapshot = await getDocs(leaveQuery);
    const leaveRequests = await Promise.all(leaveSnapshot.docs.map(d => docToTyped<any>(d)));

    let unpaidLeaveDays = 0;
    const daysInPeriod = eachDayOfInterval({ start, end });

    daysInPeriod.forEach(day => {
        const isOnUnpaidLeave = leaveRequests.some(req => {
            const reqStart = startOfDay(req.startDate);
            const reqEnd = startOfDay(req.endDate);
            return req.leaveType === 'Unpaid' && isSameDay(day, reqStart) || (isAfter(day, reqStart) && !isAfter(day, reqEnd));
        });

        if (isOnUnpaidLeave) {
            unpaidLeaveDays++;
        }
    });

    return unpaidLeaveDays;
}

export async function generatePayrollForEmployee(employeeId: string, employeeName: string, dateRange: { from: Date, to: Date }): Promise<Payroll | null> {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) throw new Error('Employee not found');

    const employee = await docToTyped<Employee>(employeeSnap);
    
    if (!employee.monthlySalary || !employee.shiftStartTime) {
        throw new Error('Employee is missing required payroll configuration (monthly salary or shift start time).');
    }
    
    // Reconstruct dates on server to avoid timezone issues from client
    const fromDate = dateRange.from;
    const toDate = dateRange.to;
    const payPeriodStart = new Date(getYear(fromDate), getMonth(fromDate), getDate(fromDate));
    const payPeriodEnd = new Date(getYear(toDate), getMonth(toDate), getDate(toDate));

    const payrollQuery = query(
        collection(db, 'payroll'), 
        where('employeeId', '==', employee.id)
    );

    const allPayrollsSnap = await getDocs(payrollQuery);
    const allPayrolls = await Promise.all(allPayrollsSnap.docs.map(d => docToTyped<Payroll>(d)));
    
    const existingPayroll = allPayrolls.find(p => isSameDay(new Date(p.payPeriodStart), payPeriodStart) && isSameDay(new Date(p.payPeriodEnd), payPeriodEnd));
    if (existingPayroll) {
        throw new Error(`Payroll for this exact period (${format(payPeriodStart, 'MMM d')} - ${format(payPeriodEnd, 'MMM d')}) already exists for ${employeeName}.`);
    }

    const payPeriodDays = eachDayOfInterval({ start: payPeriodStart, end: payPeriodEnd });
    
    const weeklyOffDayNumber = employee.weeklyOffDay ? getWeekDayNumber(employee.weeklyOffDay) : -1; 
    
    const totalWorkingDays = payPeriodDays.filter(day => day.getDay() !== weeklyOffDayNumber).length;
    if (totalWorkingDays <= 0) throw new Error("No working days in this pay period.");

    const perDaySalary = employee.monthlySalary / totalWorkingDays;
    
    const unpaidLeaveDays = await getLeaveDaysForPeriod(employee.name, payPeriodStart, payPeriodEnd);

    const attendanceQuery = query(
        collection(db, 'attendanceLogs'),
        where('employeeName', '==', employee.name)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const allAttendanceLogs = await Promise.all(attendanceSnapshot.docs.map(d => docToTyped<AttendanceLog>(d)));
    
    const endOfPayPeriod = add(payPeriodEnd, { days: 1 });
    const attendanceLogsInPeriod = allAttendanceLogs.filter(log => {
        const clockInDate = new Date(log.clockIn);
        return clockInDate >= payPeriodStart && clockInDate < endOfPayPeriod;
    });

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
        
        if (isAfter(clockIn, lateBuffer)) {
            lateDays++;
        }
    });

    const lateDeductions = lateDays * LATE_DEDUCTION_AMOUNT;
    const unpaidLeaveDeductions = unpaidLeaveDays * perDaySalary;
    
    const baseSalaryForDaysWorked = perDaySalary * actualDaysWorked;
    const finalSalary = baseSalaryForDaysWorked - lateDeductions - unpaidLeaveDeductions;
    
    const newPayrollData: Omit<Payroll, 'id'> = {
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
        unpaidLeaveDays,
        unpaidLeaveDeductions,
        tips: 0,
        deductions: 0,
        finalSalary,
        status: 'pending',
        generatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'payroll'), newPayrollData);

    return { id: docRef.id, ...newPayrollData };
}

export async function recalculatePayroll(payrollId: string): Promise<void> {
    const payrollRef = doc(db, 'payroll', payrollId);
    const payrollSnap = await getDoc(payrollRef);
    if (!payrollSnap.exists()) throw new Error('Payroll record not found');
    const payroll = await docToTyped<Payroll>(payrollSnap);

    const baseSalaryForDaysWorked = payroll.perDaySalary * payroll.actualDaysWorked;
    const tips = payroll.tips || 0;
    const otherDeductions = payroll.deductions || 0;

    const finalSalary = baseSalaryForDaysWorked - payroll.lateDeductions - payroll.unpaidLeaveDeductions + tips - otherDeductions;
    
    await updateDoc(payrollRef, { finalSalary });
}
