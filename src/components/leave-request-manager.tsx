
'use client';

import type { LeaveRequest, LeaveStatus } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useTransition } from 'react';
import { approveLeaveAction, denyLeaveAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';

export function LeaveRequestManager({ requests }: { requests: LeaveRequest[] }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleApprove = (id: string) => {
        startTransition(async () => {
            const result = await approveLeaveAction(id);
            if (result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    };

    const handleDeny = (id: string) => {
        startTransition(async () => {
            const result = await denyLeaveAction(id);
            if (result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    };
    
    const getStatusVariant = (status: LeaveStatus) => {
        switch (status) {
            case 'Approved':
                return 'default';
            case 'Denied':
                return 'destructive';
            case 'Pending':
                return 'secondary';
            default:
                return 'secondary';
        }
    };
    
    const formatDateRange = (start: Date, end: Date) => {
        const startDate = format(new Date(start), 'PP');
        const endDate = format(new Date(end), 'PP');
        if (startDate === endDate) {
            return startDate;
        }
        return `${startDate} to ${endDate}`;
    }

    const pendingRequests = requests.filter(r => r.status === 'Pending');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Approve or deny employee leave requests.</CardDescription>
            </CardHeader>
            <CardContent>
                {pendingRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No pending leave requests.</p>
                ) : (
                    <ScrollArea className="h-96">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.employeeName}</TableCell>
                                        <TableCell>{formatDateRange(req.startDate, req.endDate)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{req.leaveType}</TableCell>
                                        <TableCell className="text-xs max-w-[120px] truncate">{req.reason}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="icon" variant="outline" onClick={() => handleApprove(req.id)} disabled={isPending}>
                                                {isPending ? <Loader2 className="animate-spin" /> : <Check className="text-green-500"/>}
                                            </Button>
                                            <Button size="icon" variant="outline" onClick={() => handleDeny(req.id)} disabled={isPending}>
                                                {isPending ? <Loader2 className="animate-spin" /> : <X className="text-red-500" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
