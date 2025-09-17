
'use client';

import { useTransition, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { clockInAction, clockOutAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, LogOut, History, Clock } from 'lucide-react';
import type { User, AttendanceStatus, AttendanceLog } from '@/lib/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';

interface AttendanceTrackerProps {
    user: User;
    status: AttendanceStatus;
    history: AttendanceLog[];
    setStatus: Dispatch<SetStateAction<AttendanceStatus | null>>;
}

export function AttendanceTracker({ user, status, history, setStatus }: AttendanceTrackerProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatLocaleTime = (date: Date | string | undefined) => {
    if (!date) return '...';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
    const formatLocaleDate = (date: Date | string | undefined) => {
    if (!date) return '...';
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };


  const handleClockIn = () => {
    startTransition(async () => {
      const result = await clockInAction(user);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setStatus({ status: 'Clocked In', clockInTime: new Date() });
        router.refresh();
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
        setStatus({ status: 'Clocked Out' });
        router.refresh();
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
                        ? `Clocked in at ${formatLocaleTime(status.clockInTime)}`
                        : isClockedIn ? "Clocked in" : "You are currently clocked out."
                    }
                </p>
            </div>
             <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleClockIn} disabled={isPending || isClockedIn} >
                    {isPending && isClockedIn === false ? <Loader2 className="animate-spin" /> : <LogIn />}
                    Clock In
                </Button>
                <Button onClick={handleClockOut} disabled={isPending || !isClockedIn} variant="destructive">
                    {isPending && isClockedIn === true ? <Loader2 className="animate-spin" /> : <LogOut />}
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
                            <TableCell>{isClient ? formatLocaleDate(log.clockIn) : '...'}</TableCell>
                            <TableCell>{isClient ? formatLocaleTime(log.clockIn) : '...'}</TableCell>
                            <TableCell>{isClient ? formatLocaleTime(log.clockOut) : '...'}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </ScrollArea>
      </div>
    </div>
  );
}
