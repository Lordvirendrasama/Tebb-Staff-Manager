
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Payroll, Employee } from '@/lib/constants';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { generatePayrollAction, markPayrollAsPaidAction, deletePayrollAction } from '@/app/actions/payroll-actions';
import { Loader2, FileText, CheckCircle, Trash2, Info, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { PayrollDetailsDialog } from './payroll-details-dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';


export function PayrollManager({ payrolls, employees }: { payrolls: Payroll[], employees: Employee[] }) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [payrollForDate, setPayrollForDate] = useState<Date | undefined>(new Date());
    const { toast } = useToast();

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
    const isPayrollConfigured = selectedEmployee && selectedEmployee.monthlySalary && selectedEmployee.payFrequency && selectedEmployee.payStartDate && selectedEmployee.shiftStartTime;

    const handleGeneratePayroll = () => {
        if (!selectedEmployeeId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an employee.' });
            return;
        }

        if (!isPayrollConfigured || !selectedEmployee) {
             toast({ variant: 'destructive', title: 'Error', description: 'Selected employee does not have complete payroll configuration.' });
            return;
        }

        startTransition(async () => {
            const result = await generatePayrollAction(selectedEmployeeId, selectedEmployee.name, payrollForDate);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleMarkAsPaid = (payrollId: string) => {
         startTransition(async () => {
            const result = await markPayrollAsPaidAction(payrollId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

     const handleDeletePayroll = (payrollId: string) => {
        startDeleteTransition(async () => {
            const result = await deletePayrollAction(payrollId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const formatDateRange = (start: Date, end: Date) => {
        return `${format(new Date(start), 'MMM d, yyyy')} - ${format(new Date(end), 'MMM d, yyyy')}`;
    };

    const getStatusVariant = (status: string) => {
        return status === 'paid' ? 'default' : 'secondary';
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll Management</CardTitle>
                <CardDescription>Generate new payrolls and manage existing ones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                    <h4 className="font-medium text-sm">Generate New Payroll</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId} disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn('justify-start text-left font-normal', !payrollForDate && 'text-muted-foreground')}
                              disabled={isPending}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {payrollForDate ? format(payrollForDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={payrollForDate}
                              onSelect={setPayrollForDate}
                              initialFocus
                              captionLayout="dropdown-buttons" 
                              fromYear={2020} 
                              toYear={new Date().getFullYear() + 1}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button onClick={handleGeneratePayroll} disabled={isPending || !selectedEmployeeId || !isPayrollConfigured} className="w-full lg:w-auto">
                            {isPending ? <Loader2 className="animate-spin" /> : <FileText />}
                            Generate
                        </Button>
                    </div>
                     {selectedEmployeeId && !isPayrollConfigured && (
                        <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Missing Configuration</AlertTitle>
                            <AlertDescription>
                                This employee's payroll information is incomplete. Please set their monthly salary, pay frequency, cycle start date, and shift start time in the Staff Manager.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Generated Payrolls</h4>
                     {payrolls.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">No payrolls generated yet.</div>
                     ) : (
                        <ScrollArea className="h-96">
                            <div className="space-y-3">
                                {payrolls.map(payroll => (
                                    <div key={payroll.id} className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold">{payroll.employeeName}</p>
                                            <p className="text-xs text-muted-foreground">{formatDateRange(payroll.payPeriodStart, payroll.payPeriodEnd)}</p>
                                            <p className="text-lg font-bold mt-1">
                                                ₹{typeof payroll.finalSalary === 'number' ? payroll.finalSalary.toFixed(2) : '...'}
                                            </p>
                                        </div>
                                        <div className="flex items-center flex-wrap gap-2">
                                            <Badge variant={getStatusVariant(payroll.status)} className="capitalize">{payroll.status}</Badge>
                                            <PayrollDetailsDialog payroll={payroll}>
                                                <Button variant="outline" size="sm">Details</Button>
                                            </PayrollDetailsDialog>
                                            {payroll.status === 'pending' && (
                                                <Button onClick={() => handleMarkAsPaid(payroll.id)} disabled={isPending || isDeleting} size="sm">
                                                    {(isPending || isDeleting) ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4"/>}
                                                    Mark Paid
                                                </Button>
                                            )}
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" disabled={isPending || isDeleting}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the payroll record for {payroll.employeeName} for the period {formatDateRange(payroll.payPeriodStart, payroll.payPeriodEnd)}. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeletePayroll(payroll.id)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                                            {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete'}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                     )}
                </div>
            </CardContent>
        </Card>
    );
}
