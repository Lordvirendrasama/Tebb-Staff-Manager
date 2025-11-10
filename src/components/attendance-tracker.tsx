
'use client';

import { useTransition, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { clockInAction, clockOutAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, LogOut, History, Clock } from 'lucide-react';
import type { User, AttendanceStatus, AttendanceLog, Employee } from '@/lib/constants';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { formatIST } from '@/lib/date-utils';
import { ShiftCountdown } from './shift-countdown';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/ui/alert-dialog';
import { addHours, addMinutes, set } from 'date-fns';

interface AttendanceTrackerProps {
    user: User;
    status: AttendanceStatus;
    history: AttendanceLog[];
    employee: Employee;
    setStatus: Dispatch<SetStateAction<AttendanceStatus | null>>;
    setHistory: Dispatch<SetStateAction<AttendanceLog[]>>;
}

export function AttendanceTracker({ user, status, history, employee, setStatus, setHistory }: AttendanceTrackerProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatLocaleTime = (date: Date | string | undefined) => {
    if (!date) return '...';
    if (!isClient) return '...';
    return formatIST(new Date(date), 'p');
  };
  
  const formatLocaleDate = (date: Date | string | undefined) => {
    if (!date) return '...';
    if (!isClient) return '...';
    return formatIST(new Date(date), 'MMM d, yyyy');
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

  const performClockOut = () => {
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

  const isEarlyClockOut = () => {
    if (!isClockedIn || !status.clockInTime || !employee.standardWorkHours) {
        return false;
    }
    const clockInDate = new Date(status.clockInTime);
    const cutoffTime = set(clockInDate, { hours: 10, minutes: 15, seconds: 0, milliseconds: 0 });
    const isEarlyBird = clockInDate < cutoffTime;

    let shiftEndTime = addHours(clockInDate, employee.standardWorkHours);
    if (isEarlyBird) {
      shiftEndTime = addMinutes(shiftEndTime, -10);
    }
    
    return new Date() < shiftEndTime;
  }
  
  const handleClockOutClick = () => {
      if (!isEarlyClockOut()) {
          performClockOut();
      }
  }

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
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            onClick={handleClockOutClick}
                            disabled={isPending || !isClockedIn}
                            variant="destructive"
                            className="w-full"
                        >
                            {isPending && isClockedIn === true ? <Loader2 className="animate-spin" /> : <LogOut />}
                            <span>Clock Out</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You have not completed your shift yet. Are you sure you want to clock out early?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={performClockOut} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                                {isPending ? <Loader2 className="animate-spin" /> : 'Yes, Clock Out'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {isClockedIn && status.clockInTime && employee && (
                    <ShiftCountdown clockInTime={status.clockInTime} standardWorkHours={employee.standardWorkHours} />
                )}
            </div>
        </div>
      
        <div className="space-y-2">
            <div className='flex items-center gap-2'>
                <History className="h-5 w-5 text-muted-foreground"/>
                <h4 className="font-medium text-sm">Recent Activity</h4>
            </div>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-48 w-full">
                    <div className="p-2 space-y-2">
                      {history.slice(0, 7).map((log) => (
                          <div key={log.id} className="p-3 rounded-md border bg-background text-sm">
                              <p className="font-medium">{isClient ? formatLocaleDate(log.clockIn) : '...'}</p>
                              <div className="flex justify-between items-center text-muted-foreground mt-1">
                                  <span>In: {isClient ? formatLocaleTime(log.clockIn) : '...'}</span>
                                  <span>Out: {isClient ? formatLocaleTime(log.clockOut) : '...'}</span>
                              </div>
                          </div>
                      ))}
                      {history.length === 0 && (
                        <div className="flex items-center justify-center h-24">
                          <p className="text-sm text-muted-foreground">No recent activity.</p>
                        </div>
                      )}
                    </div>
                </ScrollArea>
              </CardContent>
            </Card>
      </div>
    </div>
  );
}
