
'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { requestLeaveAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CalendarDays, ClipboardList, Wallet, Repeat } from 'lucide-react';
import type { User, LeaveRequest, LeaveType, LeaveStatus } from '@/lib/constants';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import type { DateRange } from 'react-day-picker';

export function LeaveTracker({ user, leaveRequests }: { user: User; leaveRequests: LeaveRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>();
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('Unpaid');

  const handleRequestLeave = () => {
    if (!date || !reason || !date.from || !date.to) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a date range and provide a reason.' });
        return;
    }

    startTransition(async () => {
      const result = await requestLeaveAction(user, date, reason, leaveType);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setDate(undefined);
        setReason('');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
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

  return (
    <div className="space-y-4">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm flex items-center gap-2"><Send className="h-4 w-4 text-primary"/>New Leave Request</h4>
            <Popover>
                <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarDays className="mr-2" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="range"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
            <RadioGroup defaultValue="Unpaid" onValueChange={(value: LeaveType) => setLeaveType(value)} className="grid grid-cols-2 gap-4">
                 <div>
                    <RadioGroupItem value="Unpaid" id="unpaid" className="peer sr-only" />
                    <Label
                      htmlFor="unpaid"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Wallet className="mb-3 h-6 w-6" />
                      Unpaid Day Off
                    </Label>
                  </div>
                   <div>
                    <RadioGroupItem value="Paid (Made Up)" id="paid" className="peer sr-only" />
                    <Label
                      htmlFor="paid"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Repeat className="mb-3 h-6 w-6" />
                      Paid (Make-up shift)
                    </Label>
                  </div>
            </RadioGroup>
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
                            <TableHead>Dates</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {leaveRequests.slice(0, 5).map((req) => (
                        <TableRow key={req.id}>
                        <TableCell>{formatDateRange(req.startDate, req.endDate)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{req.leaveType}</TableCell>
                        <TableCell className="text-right">
                             <Badge variant={getStatusVariant(req.status)}>
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
