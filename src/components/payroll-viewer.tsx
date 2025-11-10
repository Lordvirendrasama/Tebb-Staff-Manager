'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Payroll } from '@/lib/constants';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { PayrollDetailsDialog } from './payroll-details-dialog';

export function PayrollViewer({ payrolls }: { payrolls: Payroll[] }) {
    const latestPayroll = payrolls.length > 0 ? payrolls[0] : null;
    const payrollHistory = payrolls.slice(0); // Show all payrolls in history now

    const formatDateRange = (start: Date, end: Date) => {
        return `${format(new Date(start), 'MMM d, yyyy')} - ${format(new Date(end), 'MMM d, yyyy')}`;
    };

     const getStatusVariant = (status: string) => {
        return status === 'paid' ? 'default' : 'secondary';
    };

    if (payrolls.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>My Payroll</CardTitle>
                    <CardDescription>Your salary slips will appear here once generated.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-12">No payroll data available yet.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll History</CardTitle>
                <CardDescription>Your previous salary slips.</CardDescription>
            </CardHeader>
            <CardContent>
                {payrollHistory.length > 0 ? (
                    <ScrollArea className="h-96 w-full">
                        <div className="space-y-2">
                            {payrollHistory.map(p => (
                                <div key={p.id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">₹{p.finalSalary.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">{formatDateRange(p.payPeriodStart, p.payPeriodEnd)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getStatusVariant(p.status)} className="capitalize">{p.status}</Badge>
                                            <PayrollDetailsDialog payroll={p}>
                                                <Button variant="ghost" size="sm">Details</Button>
                                            </PayrollDetailsDialog>
                                        </div>
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
    );
}
