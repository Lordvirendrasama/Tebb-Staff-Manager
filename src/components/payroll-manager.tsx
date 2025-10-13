
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Payroll, Employee, PayFrequency } from '@/lib/constants';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { generatePayrollAction, markPayrollAsPaidAction, deletePayrollAction, updatePayrollAction } from '@/app/actions/payroll-actions';
import { Loader2, FileText, CheckCircle, Trash2, Info, Edit2, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { format, add, sub, isBefore } from 'date-fns';
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
import { Input } from './ui/input';

function EditablePayrollField({ payrollId, initialValue, field, label }: { payrollId: string, initialValue: number, field: 'tips' | 'deductions', label: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSave = () => {
        startTransition(async () => {
            const result = await updatePayrollAction(payrollId, { [field]: Number(value) });
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsEditing(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                 <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">₹</span>
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="h-8 pl-8"
                        disabled={isPending}
                    />
                 </div>
                <Button size="icon" className="h-8 w-8" onClick={handleSave} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                </Button>
                 <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(false)} disabled={isPending}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <span>{label}: ₹{value.toFixed(2)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3 w-3" />
            </Button>
        </div>
    );
}

interface PayCycle {
    from: Date;
    to: Date;
    label: string;
    key: string;
}

const getPayCycles = (employee: Employee | undefined): PayCycle[] => {
    if (!employee || !employee.payFrequency || !employee.payStartDate) {
        return [];
    }

    const cycles: PayCycle[] = [];
    const today = new Date();
    let currentCycleStart = new Date(employee.payStartDate);

    const getDuration = (freq: PayFrequency): Duration => {
        switch (freq) {
            case 'weekly': return { weeks: 1 };
            case 'bi-weekly': return { weeks: 2 };
            case 'monthly':
            default: return { months: 1 };
        }
    }
    const duration = getDuration(employee.payFrequency);

    // Go back a few cycles
    for (let i = 0; i < 6; i++) {
        const cycleEnd = sub(add(currentCycleStart, duration), { days: 1 });
        cycles.push({
            from: currentCycleStart,
            to: cycleEnd,
            label: `${format(currentCycleStart, 'MMM d')} - ${format(cycleEnd, 'MMM d, yyyy')}`,
            key: format(currentCycleStart, 'yyyy-MM-dd')
        });
        currentCycleStart = sub(currentCycleStart, duration);
    }
    
    // Ensure the current cycle is included if the start date was in the future
    let futureCycleStart = new Date(employee.payStartDate);
    while(isBefore(futureCycleStart, add(today, { months: 1 }))) {
        const cycleEnd = sub(add(futureCycleStart, duration), { days: 1 });
        const key = format(futureCycleStart, 'yyyy-MM-dd');
        if (!cycles.some(c => c.key === key)) {
             cycles.push({
                from: futureCycleStart,
                to: cycleEnd,
                label: `${format(futureCycleStart, 'MMM d')} - ${format(cycleEnd, 'MMM d, yyyy')}`,
                key: key
            });
        }
        futureCycleStart = add(futureCycleStart, duration);
    }
    
    return cycles.sort((a,b) => b.from.getTime() - a.from.getTime());
};


export function PayrollManager({ payrolls, employees }: { payrolls: Payroll[], employees: Employee[] }) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedCycleKey, setSelectedCycleKey] = useState<string>('');
    const { toast } = useToast();
    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
    const isPayrollConfigured = selectedEmployee && selectedEmployee.monthlySalary && selectedEmployee.payFrequency && selectedEmployee.payStartDate;
    
    const payCycles = useMemo(() => getPayCycles(selectedEmployee), [selectedEmployee]);
    const selectedCycle = payCycles.find(c => c.key === selectedCycleKey);

    useEffect(() => {
      setSelectedCycleKey('');
    }, [selectedEmployeeId]);


    const handleGeneratePayroll = () => {
        if (!selectedEmployeeId || !selectedEmployee) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an employee.' });
            return;
        }

        if (!selectedCycle) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a pay cycle.' });
            return;
        }

        if (!isPayrollConfigured) {
             toast({ variant: 'destructive', title: 'Error', description: 'Selected employee does not have complete payroll configuration.' });
            return;
        }

        startTransition(async () => {
            const result = await generatePayrollAction(selectedEmployeeId, selectedEmployee.name, {from: selectedCycle.from, to: selectedCycle.to});
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
        if (!isClient) return '...';
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
                        
                        <Select onValueChange={setSelectedCycleKey} value={selectedCycleKey} disabled={isPending || !selectedEmployeeId || !isPayrollConfigured}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Pay Cycle" />
                            </SelectTrigger>
                            <SelectContent>
                                {payCycles.map(cycle => (
                                    <SelectItem key={cycle.key} value={cycle.key}>
                                        {cycle.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button onClick={handleGeneratePayroll} disabled={isPending || !selectedEmployeeId || !isPayrollConfigured || !selectedCycle} className="w-full lg:w-auto">
                            {isPending ? <Loader2 className="animate-spin" /> : <FileText />}
                            Generate
                        </Button>
                    </div>
                     {selectedEmployeeId && !isPayrollConfigured && (
                        <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Missing Configuration</AlertTitle>
                            <AlertDescription>
                                This employee's payroll information is incomplete. Please set their monthly salary, pay frequency, and cycle start date in the Staff Manager.
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
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <p className="font-semibold">{payroll.employeeName}</p>
                                                <p className="text-xs text-muted-foreground">{formatDateRange(payroll.payPeriodStart, payroll.payPeriodEnd)}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                <EditablePayrollField payrollId={payroll.id} initialValue={payroll.tips || 0} field="tips" label="Tips" />
                                                <EditablePayrollField payrollId={payroll.id} initialValue={payroll.deductions || 0} field="deductions" label="Deductions"/>
                                            </div>
                                            <p className="text-lg font-bold">
                                                Final Salary: ₹{typeof payroll.finalSalary === 'number' ? payroll.finalSalary.toFixed(2) : '...'}
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
