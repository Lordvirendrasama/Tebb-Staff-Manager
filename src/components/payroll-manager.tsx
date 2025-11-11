
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPayrollDataAction } from '@/app/actions/payroll-actions';
import type { Employee, Payroll } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function PayrollManager({ employees }: { employees: Employee[] }) {
    const [loading, setLoading] = useState(true);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    
    useEffect(() => {
        const fetchPayrolls = async () => {
            setLoading(true);
            const data = await getPayrollDataAction();
            setPayrolls(data);
            setLoading(false);
        }
        fetchPayrolls();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll Manager</CardTitle>
                <CardDescription>View and manage employee payroll.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Pay Period</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrolls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No payroll data available.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payrolls.map((payroll) => (
                                    <TableRow key={payroll.id}>
                                        <TableCell>{payroll.employeeName}</TableCell>
                                        <TableCell>
                                            {format(new Date(payroll.payPeriodStart), 'MMM d, yyyy')} - {format(new Date(payroll.payPeriodEnd), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>₹{payroll.amount.toLocaleString()}</TableCell>
                                        <TableCell>{payroll.status}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
