
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Payroll } from '@/lib/constants';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PayrollDetailsDialog } from './payroll-details-dialog';

export function PayrollViewer({ payrolls }: { payrolls: Payroll[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(payrolls.length > 0 ? payrolls[0].id : null);
    
    const latestPayroll = payrolls.length > 0 ? payrolls[0] : null;
    const payrollHistory = payrolls.slice(1);

    const formatDateRange = (start: Date, end: Date) => {
        return `${format(new Date(start), 'MMM d, yyyy')} - ${format(new Date(end), 'MMM d, yyyy')}`;
    };

     const getStatusVariant = (status: string) => {
        return status === 'paid' ? 'default' : 'secondary';
    };

    if (!latestPayroll) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>My Payroll</CardTitle>
                    <CardDescription>Your payroll details will appear here once generated.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-12">No payroll data available yet.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Latest Payroll</CardTitle>
                    <CardDescription>{formatDateRange(latestPayroll.payPeriodStart, latestPayroll.payPeriodEnd)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Net Pay</p>
                            <p className="text-3xl font-bold">${latestPayroll.totalSalary.toFixed(2)}</p>
                        </div>
                         <Badge variant={getStatusVariant(latestPayroll.status)} className="capitalize h-fit">{latestPayroll.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Hours Worked</p>
                            <p className="font-medium">{latestPayroll.hoursWorked.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Overtime</p>
                            <p className="font-medium">{latestPayroll.overtimeHours.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Tips</p>
                            <p className="font-medium">${(latestPayroll.tips || 0).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Deductions</p>
                            <p className="font-medium">${(latestPayroll.deductions || 0).toFixed(2)}</p>
                        </div>
                    </div>
                    <PayrollDetailsDialog payroll={latestPayroll}>
                        <Button variant="secondary" className="w-full">View Full Details</Button>
                    </PayrollDetailsDialog>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll History</CardTitle>
                    <CardDescription>Your previous pay stubs.</CardDescription>
                </CardHeader>
                <CardContent>
                    {payrollHistory.length > 0 ? (
                        <ScrollArea className="h-72 w-full">
                            <div className="space-y-2">
                                {payrollHistory.map(p => (
                                    <div key={p.id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">${p.totalSalary.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{formatDateRange(p.payPeriodStart, p.payPeriodEnd)}</p>
                                            </div>
                                            <PayrollDetailsDialog payroll={p}>
                                                <Button variant="ghost" size="sm">Details</Button>
                                            </PayrollDetailsDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No past payrolls found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
