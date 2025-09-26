
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { Payroll } from '@/lib/constants';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

export function PayrollDetailsDialog({ payroll, children }: { payroll: Payroll; children: React.ReactNode }) {
    const formatDate = (date: Date) => format(new Date(date), 'MMM d, yyyy');

    const formatCurrency = (value: number | undefined | null) => {
        if (typeof value !== 'number') {
            return '...';
        }
        return `₹${value.toFixed(2)}`;
    }

    const baseSalary = payroll.perDaySalary * payroll.actualDaysWorked;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Salary Slip</DialogTitle>
                    <DialogDescription>
                        For {payroll.employeeName} - {formatDate(payroll.payPeriodStart)} to {formatDate(payroll.payPeriodEnd)}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Monthly Salary</span>
                        <span className="font-medium">{formatCurrency(payroll.monthlySalary)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Per-Day Salary</span>
                        <span className="font-medium">{formatCurrency(payroll.perDaySalary)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Days Worked / Total Days</span>
                        <span className="font-medium">{payroll.actualDaysWorked} / {payroll.totalWorkingDays}</span>
                    </div>
                    <Separator />
                    <div className="font-semibold">Earnings</div>
                     <div className="flex justify-between items-center pl-4">
                        <span className="text-muted-foreground">Salary for Days Worked</span>
                        <span className="font-medium">{formatCurrency(baseSalary)}</span>
                    </div>
                     <div className="flex justify-between items-center pl-4">
                        <span className="text-muted-foreground">Tips</span>
                        <span className="font-medium text-green-500">+ {formatCurrency(payroll.tips)}</span>
                    </div>
                    <Separator />
                     <div className="font-semibold">Deductions</div>
                     <div className="flex justify-between items-center pl-4">
                        <span className="text-muted-foreground">Late Days ({payroll.lateDays})</span>
                        <span className="font-medium text-destructive">- {formatCurrency(payroll.lateDeductions)}</span>
                    </div>
                     <div className="flex justify-between items-center pl-4">
                        <span className="text-muted-foreground">Unpaid Leave Days ({payroll.unpaidLeaveDays || 0})</span>
                        <span className="font-medium text-destructive">- {formatCurrency(payroll.unpaidLeaveDeductions)}</span>
                    </div>
                    <div className="flex justify-between items-center pl-4">
                        <span className="text-muted-foreground">Other Deductions</span>
                        <span className="font-medium text-destructive">- {formatCurrency(payroll.deductions)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between items-center font-bold text-base">
                        <span>Final Salary</span>
                        <span>{formatCurrency(payroll.finalSalary)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">{payroll.status}</span>
                    </div>
                    {payroll.paymentDate && (
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Payment Date</span>
                            <span className="font-medium">{formatDate(payroll.paymentDate)}</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
