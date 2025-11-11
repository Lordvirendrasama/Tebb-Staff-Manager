'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAttendanceLogsAction } from '@/app/actions/attendance-actions';
import type { Employee, User, AttendanceLog, WeekDay } from '@/lib/constants';
import { Loader2, Calculator, CalendarDays, User as UserIcon, Wallet, Coins } from 'lucide-react';
import { format, getDaysInMonth, getDay, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { WEEKDAYS } from '@/lib/constants';

interface PayrollDetails {
    totalDays: number;
    weekOffs: number;
    totalWorkingDays: number;
    daysWorked: number;
    payableAmount: number;
    perDaySalary: number;
}

export function PayrollManager({ employees }: { employees: Employee[] }) {
    const [isCalculating, startTransition] = useTransition();
    const { toast } = useToast();

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));

    const [payrollDetails, setPayrollDetails] = useState<PayrollDetails | null>(null);

    const handleCalculate = () => {
        if (!selectedEmployeeId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an employee.' });
            return;
        }

        const employee = employees.find(e => e.id === selectedEmployeeId);
        if (!employee || !employee.monthlySalary) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected employee does not have a salary configured.' });
            return;
        }

        startTransition(async () => {
            try {
                const monthDate = setYear(setMonth(new Date(), selectedMonth), selectedYear);
                const logs = await getAttendanceLogsAction({ employeeName: employee.name, month: monthDate });

                const daysInMonth = getDaysInMonth(monthDate);
                const weekOffDayIndex = WEEKDAYS.indexOf(employee.weeklyOffDay);
                
                let weekOffs = 0;
                for (let i = 1; i <= daysInMonth; i++) {
                    const day = getDay(new Date(selectedYear, selectedMonth, i));
                    if (day === weekOffDayIndex) {
                        weekOffs++;
                    }
                }
                
                const totalWorkingDays = daysInMonth - weekOffs;
                const daysWorked = new Set(logs.map(log => format(new Date(log.clockIn), 'yyyy-MM-dd'))).size;
                
                const perDaySalary = totalWorkingDays > 0 ? employee.monthlySalary / totalWorkingDays : 0;
                const payableAmount = perDaySalary * daysWorked;

                setPayrollDetails({
                    totalDays: daysInMonth,
                    weekOffs,
                    totalWorkingDays,
                    daysWorked,
                    payableAmount: parseFloat(payableAmount.toFixed(2)),
                    perDaySalary: parseFloat(perDaySalary.toFixed(2)),
                });

            } catch (error) {
                console.error(error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                toast({ variant: 'destructive', title: 'Calculation Failed', description: errorMessage });
                setPayrollDetails(null);
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll Calculator</CardTitle>
                <CardDescription>Calculate an employee's salary based on their attendance for a specific month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Employee</label>
                        <Select value={selectedEmployeeId ?? ''} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select Employee"/></SelectTrigger>
                            <SelectContent>
                                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Pay Period</label>
                        <div className="flex gap-2">
                            <Select value={selectedMonth.toString()} onValueChange={(m) => setSelectedMonth(parseInt(m))}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => <SelectItem key={i} value={i.toString()}>{format(new Date(0, i), 'MMMM')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear.toString()} onValueChange={(y) => setSelectedYear(parseInt(y))}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                <Button onClick={handleCalculate} disabled={isCalculating || !selectedEmployeeId} className="w-full">
                    {isCalculating ? <Loader2 className="animate-spin mr-2"/> : <Calculator className="mr-2 h-4 w-4"/>}
                    Calculate Payroll
                </Button>

                {isCalculating && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                )}

                {payrollDetails && !isCalculating && (
                    <Card className="bg-background">
                        <CardHeader>
                            <CardTitle className="text-lg">Payroll Summary</CardTitle>
                            <CardDescription>
                                For {employees.find(e => e.id === selectedEmployeeId)?.name} in {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                            <div className="p-4 border rounded-lg">
                                <p className="text-2xl font-bold">{payrollDetails.daysWorked}</p>
                                <p className="text-sm text-muted-foreground">Days Worked</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <p className="text-2xl font-bold">{payrollDetails.totalWorkingDays}</p>
                                <p className="text-sm text-muted-foreground">Working Days</p>
                            </div>
                             <div className="p-4 border rounded-lg">
                                <p className="text-2xl font-bold">₹{payrollDetails.perDaySalary.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Per-Day Salary</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <p className="text-2xl font-bold">{payrollDetails.weekOffs}</p>
                                <p className="text-sm text-muted-foreground">Week Offs</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <p className="text-2xl font-bold">{payrollDetails.totalDays}</p>
                                <p className="text-sm text-muted-foreground">Days in Month</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-center justify-center p-6 mt-4 bg-muted/50 rounded-b-lg">
                            <Wallet className="h-8 w-8 text-primary mb-2"/>
                            <p className="text-sm text-muted-foreground">Amount to be Paid</p>
                            <p className="text-3xl font-bold text-primary">₹{payrollDetails.payableAmount.toLocaleString()}</p>
                        </CardFooter>
                    </Card>
                )}

            </CardContent>
        </Card>
    );
}
