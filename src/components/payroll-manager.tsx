
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Payroll, Employee } from '@/lib/constants';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { generatePayrollAction, markPayrollAsPaidAction } from '@/app/actions/payroll-actions';
import { Loader2, FileText, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { PayrollDetailsDialog } from './payroll-details-dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';

export function PayrollManager({ payrolls, employees }: { payrolls: Payroll[], employees: Employee[] }) {
    const [isPending, startTransition] = useTransition();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
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
            const result = await generatePayrollAction(selectedEmployeeId, selectedEmployee.name);
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
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId} disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGeneratePayroll} disabled={isPending || !selectedEmployeeId || !isPayrollConfigured} className="w-full sm:w-auto">
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
                                            <p className="text-lg font-bold mt-1">₹{payroll.finalSalary.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={getStatusVariant(payroll.status)} className="capitalize">{payroll.status}</Badge>
                                            <PayrollDetailsDialog payroll={payroll}>
                                                <Button variant="outline" size="sm">Details</Button>
                                            </PayrollDetailsDialog>
                                            {payroll.status === 'pending' && (
                                                <Button onClick={() => handleMarkAsPaid(payroll.id)} disabled={isPending} size="sm">
                                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4"/>}
                                                    Mark Paid
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                     )}
                </div>
            </CardContent>
        </Card>
    )
}
