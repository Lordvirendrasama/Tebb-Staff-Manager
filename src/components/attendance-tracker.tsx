
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
    setHistory: Dispatch<SetStateAction<AttendanceLog[]>>;
}

export function AttendanceTracker({ user, status, history, setStatus, setHistory }: AttendanceTrackerProps) {
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
        const newClockInTime = new Date();
        setStatus({ status: 'Clocked In', clockInTime: newClockInTime });
        const newLog: AttendanceLog = {
          id: `new-${Date.now()}`,
          employeeName: user,
          clockIn: newClockInTime,
        };
        setHistory(prevHistory => [newLog, ...prevHistory]);
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
        setHistory(prevHistory => {
            const updatedHistory = [...prevHistory];
            const latestLog = updatedHistory.find(log => !log.clockOut);
            if(latestLog) {
                latestLog.clockOut = new Date();
            }
            return updatedHistory;
        });
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
             <div className="flex flex-col gap-2">
                <Button onClick={handleClockIn} disabled={isPending || isClockedIn} className="w-full">
                    {isPending && isClockedIn === false ? <Loader2 className="animate-spin" /> : <LogIn />}
                    <span>Clock In</span>
                </Button>
                <Button onClick={handleClockOut} disabled={isPending || !isClockedIn} variant="destructive" className="w-full">
                    {isPending && isClockedIn === true ? <Loader2 className="animate-spin" /> : <LogOut />}
                    <span>Clock Out</span>
                </Button>
            </div>
        </div>
      
        <div className="space-y-2">
            <div className='flex items-center gap-2'>
                <History className="h-5 w-5 text-muted-foreground"/>
                <h4 className="font-medium text-sm">Recent Activity</h4>
            </div>
            <ScrollArea className="h-48 w-full">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/3">Date</TableHead>
                        <TableHead className="w-1/3">In</TableHead>
                        <TableHead className="w-1/3">Out</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {history.slice(0, 5).map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="truncate">{isClient ? formatLocaleDate(log.clockIn) : '...'}</TableCell>
                            <TableCell className="truncate">{isClient ? formatLocaleTime(log.clockIn) : '...'}</TableCell>
                            <TableCell className="truncate">{isClient ? formatLocaleTime(log.clockOut) : '...'}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </ScrollArea>
      </div>
    </div>
  );
}
