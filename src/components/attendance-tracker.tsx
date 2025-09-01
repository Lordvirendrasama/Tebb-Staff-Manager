
'use client';

import { useTransition, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { clockInAction, clockOutAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, LogOut, History, Clock } from 'lucide-react';
import type { User, AttendanceStatus, AttendanceLog } from '@/lib/constants';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';

export function AttendanceTracker({ user, status, history }: { user: User; status: AttendanceStatus, history: AttendanceLog[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleClockIn = () => {
    startTransition(async () => {
      const result = await clockInAction(user);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleClockOut = () => {
    startTransition(async () => {
      const result = await clockOutAction(user);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const isClockedIn = status.status === 'Clocked In';

  return (
    <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">
                    {isClockedIn && isClient
                        ? `Clocked in at ${format(new Date(status.clockInTime), 'p')}`
                        : isClockedIn ? "Clocked in" : "You are currently clocked out."
                    }
                </p>
            </div>
             <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleClockIn} disabled={isPending || isClockedIn} >
                    {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
                    Clock In
                </Button>
                <Button onClick={handleClockOut} disabled={isPending || !isClockedIn} variant="destructive">
                    {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
                    Clock Out
                </Button>
            </div>
        </div>
      
        <div className="space-y-2">
            <div className='flex items-center gap-2'>
                <History className="h-5 w-5 text-muted-foreground"/>
                <h4 className="font-medium text-sm">Recent Activity</h4>
            </div>
            <ScrollArea className="h-48">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>In</TableHead>
                        <TableHead>Out</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {history.slice(0, 5).map((log, index) => (
                        <TableRow key={index}>
                            <TableCell>{format(new Date(log.clockIn), 'MMM d')}</TableCell>
                            <TableCell>{isClient ? format(new Date(log.clockIn), 'p') : '...'}</TableCell>
                            <TableCell>{log.clockOut && isClient ? format(new Date(log.clockOut), 'p') : '...'}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </ScrollArea>
      </div>
    </div>
  );
}
