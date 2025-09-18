
'use client';

import { useState, useTransition, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, FilePenLine } from 'lucide-react';
import type { LeaveRequest } from '@/lib/constants';
import { approveLeaveAction, denyLeaveAction, markAsUnpaidAction } from '@/app/actions/attendance-actions';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

export function LeaveRequestManager({ requests }: { requests: LeaveRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleAction = (action: 'approve' | 'deny', requestId: string) => {
    startTransition(async () => {
      const result = action === 'approve' ? await approveLeaveAction(requestId) : await denyLeaveAction(requestId);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleMarkAsUnpaid = (requestId: string) => {
     startTransition(async () => {
      const result = await markAsUnpaidAction(requestId);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  
  const formatDateRange = (start: Date, end: Date) => {
    if (!isClient) return '...';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (format(startDate, 'PPP') === format(endDate, 'PPP')) return format(startDate, 'PPP');
    return `${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Denied': return 'destructive';
        default: return 'outline';
    }
  };

  const filteredRequests = (status: string) => requests.filter(req => req.status === status);

  const renderRequestTable = (reqs: LeaveRequest[]) => {
      if (reqs.length === 0) {
          return <p className="text-sm text-muted-foreground text-center py-10">No requests in this category.</p>;
      }
      return (
        <ScrollArea className="h-96">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="hidden sm:table-cell">Dates</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {reqs.map(req => (
                    <Dialog key={req.id}>
                      <DialogTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell>
                            <span className="font-medium">{req.employeeName}</span>
                            <div className="sm:hidden text-xs text-muted-foreground">{formatDateRange(req.startDate, req.endDate)}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{formatDateRange(req.startDate, req.endDate)}</TableCell>
                          <TableCell className="hidden md:table-cell">{req.leaveType}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                          </TableCell>
                        </TableRow>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Leave Request Details</DialogTitle>
                          <DialogDescription>Review the leave request from {req.employeeName}.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                                <div className="font-semibold">Employee:</div>
                                <div>{req.employeeName}</div>
                                <div className="font-semibold">Dates:</div>
                                <div>{formatDateRange(req.startDate, req.endDate)}</div>
                                <div className="font-semibold">Leave Type:</div>
                                <div>{req.leaveType}</div>
                                <div className="font-semibold">Status:</div>
                                <div><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></div>
                                <div className="font-semibold col-span-1 sm:col-span-2">Reason:</div>
                                <div className="col-span-1 sm:col-span-2 text-sm p-2 bg-muted rounded-md">{req.reason}</div>
                            </div>
                        </div>
                        {req.status === 'Pending' && (
                          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                              <DialogClose asChild>
                                <Button variant="ghost">Cancel</Button>
                              </DialogClose>
                              {req.leaveType === 'Paid (Made Up)' && (
                                <Button variant="secondary" onClick={() => handleMarkAsUnpaid(req.id)} disabled={isPending}>
                                  {isPending ? <Loader2 className="animate-spin" /> : <FilePenLine />}
                                  Mark as Unpaid
                                </Button>
                              )}
                              <Button variant="destructive" onClick={() => handleAction('deny', req.id)} disabled={isPending}>
                                {isPending ? <Loader2 className="animate-spin" /> : <X />}
                                Deny
                              </Button>
                              <Button onClick={() => handleAction('approve', req.id)} disabled={isPending}>
                                {isPending ? <Loader2 className="animate-spin" /> : <Check />}
                                Approve
                              </Button>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>
                ))}
                </TableBody>
            </Table>
        </ScrollArea>
      )
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Requests</CardTitle>
        <CardDescription>Manage employee leave requests. Click a request to review and take action.</CardDescription>
      </CardHeader>
      <CardContent>
         <Tabs defaultValue="pending">
            <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="denied">Denied</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                {renderRequestTable(filteredRequests('Pending'))}
            </TabsContent>
            <TabsContent value="approved">
                {renderRequestTable(filteredRequests('Approved'))}
            </TabsContent>
            <TabsContent value="denied">
                {renderRequestTable(filteredRequests('Denied'))}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
