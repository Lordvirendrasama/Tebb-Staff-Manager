
'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { requestLeaveAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CalendarDays, ClipboardList } from 'lucide-react';
import type { User, LeaveRequest } from '@/lib/constants';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

export function LeaveTracker({ user, leaveRequests }: { user: User; leaveRequests: LeaveRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>();
  const [reason, setReason] = useState('');

  const handleRequestLeave = () => {
    if (!date || !reason) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a date and provide a reason.' });
        return;
    }

    startTransition(async () => {
      const result = await requestLeaveAction(user, date, reason);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setDate(undefined);
        setReason('');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <div className="space-y-4">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm flex items-center gap-2"><Send className="h-4 w-4 text-primary"/>New Leave Request</h4>
            <Popover>
                <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarDays className="mr-2" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
            <Textarea 
                placeholder="Reason for leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
            />
            <Button onClick={handleRequestLeave} disabled={isPending || !date || !reason} className="w-full">
                {isPending ? <Loader2 className="animate-spin" /> : <Send />}
                Submit Request
            </Button>
        </div>

        <div className="space-y-2">
            <div className='flex items-center gap-2'>
                <ClipboardList className="h-5 w-5 text-muted-foreground"/>
                <h4 className="font-medium text-sm">Request History</h4>
            </div>
            <ScrollArea className="h-48">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {leaveRequests.slice(0, 5).map((req, index) => (
                        <TableRow key={index}>
                        <TableCell>{format(new Date(req.leaveDate), 'PPP')}</TableCell>
                        <TableCell>
                            <Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Rejected' ? 'destructive' : 'secondary'}>
                                {req.status}
                            </Badge>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    </div>
  );
}
