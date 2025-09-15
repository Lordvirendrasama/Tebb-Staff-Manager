
'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, MailQuestion } from 'lucide-react';
import type { LeaveRequest } from '@/lib/constants';
import { approveLeaveAction, denyLeaveAction } from '@/app/actions/attendance-actions';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

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
  
  const formatDateRange = (start: Date, end: Date) => {
    if (!isClient) return '...';
    if (format(start, 'PPP') === format(end, 'PPP')) return format(start, 'PPP');
    return `${format(start, 'PPP')} to ${format(end, 'PPP')}`;
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
                    <TableHead>Dates</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {reqs.map(req => (
                    <TableRow key={req.id}>
                    <TableCell>{req.employeeName}</TableCell>
                    <TableCell>{formatDateRange(req.startDate, req.endDate)}</TableCell>
                    <TableCell>{req.leaveType}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{req.reason}</TableCell>
                    <TableCell>
                        {req.status === 'Pending' ? (
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleAction('approve', req.id)} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <Check className="text-green-500"/>}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleAction('deny', req.id)} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <X className="text-red-500"/>}
                            </Button>
                        </div>
                        ) : (
                            <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                        )}
                    </TableCell>
                    </TableRow>
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
        <CardDescription>Manage employee leave requests.</CardDescription>
      </CardHeader>
      <CardContent>
         <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
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
