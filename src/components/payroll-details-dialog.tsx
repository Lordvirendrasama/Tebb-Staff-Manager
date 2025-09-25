
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Payroll } from '@/lib/constants';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

export function PayrollDetailsDialog({ payroll, children }: { payroll: Payroll; children: React.ReactNode }) {
    const formatDate = (date: Date) => format(new Date(date), 'MMM d, yyyy');

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Payroll Details</DialogTitle>
                    <DialogDescription>
                        For {payroll.employeeName} - Pay Period: {formatDate(payroll.payPeriodStart)} to {formatDate(payroll.payPeriodEnd)}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Base Salary</span>
                        <span className="font-medium">${payroll.baseSalary.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Hours Worked</span>
                        <span className="font-medium">{payroll.hoursWorked.toFixed(2)} hrs</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Overtime Hours</span>
                        <span className="font-medium">{payroll.overtimeHours.toFixed(2)} hrs</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tips</span>
                        <span className="font-medium">${(payroll.tips || 0).toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Deductions</span>
                        <span className="font-medium text-destructive">-${(payroll.deductions || 0).toFixed(2)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between items-center font-bold text-base">
                        <span>Net Pay</span>
                        <span>${payroll.totalSalary.toFixed(2)}</span>
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
                    <DialogTrigger asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
