
'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { Employee, AttendanceLog } from '@/lib/constants';
import { addMonths, format, differenceInMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Separator } from './ui/separator';

type DayPerformance = 'overtime' | 'undertime' | 'on-time';

interface DayLog {
  date: Date;
  performance: DayPerformance;
  hoursWorked: number;
  minutesDifference: number;
  clockIn?: Date;
  clockOut?: Date;
}

interface AttendanceViewerProps {
    employee: Employee;
    month: Date;
    onMonthChange: (date: Date) => void;
    attendanceLogs: AttendanceLog[];
    loading: boolean;
}

export function AttendanceViewer({ employee, month, onMonthChange, attendanceLogs, loading }: AttendanceViewerProps) {
    const dayLogs = useMemo(() => {
        const newDayLogs = new Map<string, DayLog>();
        attendanceLogs.forEach(log => {
            if (!log.clockOut) return;

            const dayKey = format(log.clockIn, 'yyyy-MM-dd');
            const hoursWorked = differenceInMinutes(log.clockOut, log.clockIn) / 60;
            const minutesDifference = Math.round((hoursWorked - employee.standardWorkHours) * 60);

            let performance: DayPerformance = 'on-time';
            if (minutesDifference > 15) performance = 'overtime';
            if (minutesDifference < -15) performance = 'undertime';

            newDayLogs.set(dayKey, {
                date: log.clockIn,
                performance,
                hoursWorked,
                minutesDifference,
                clockIn: log.clockIn,
                clockOut: log.clockOut,
            });
        });
        return newDayLogs;
    }, [attendanceLogs, employee.standardWorkHours]);

    const changeMonth = (offset: number) => {
        onMonthChange(addMonths(month, offset));
    };
    
    const { totalOvertime, totalUndertime } = useMemo(() => {
        let overtime = 0;
        let undertime = 0;

        dayLogs.forEach(log => {
            if (log.minutesDifference > 0) {
                overtime += log.minutesDifference;
            } else if (log.minutesDifference < 0) {
                undertime += Math.abs(log.minutesDifference);
            }
        });

        return { totalOvertime: overtime, totalUndertime: undertime };
    }, [dayLogs]);

    const formatDuration = (minutes: number) => {
        const isNegative = minutes < 0;
        const absMinutes = Math.abs(minutes);
        const h = Math.floor(absMinutes / 60);
        const m = absMinutes % 60;
        const sign = isNegative ? '-' : '+';
        if(isNegative) {
            return `${sign} ${h > 0 ? `${h}h ` : ''}${m}m`;
        }
        return `${h > 0 ? `${h}h ` : ''}${m}m`;
    };

    const formatTotalDuration = (totalMinutes: number) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const modifiers = {
        overtime: Array.from(dayLogs.values()).filter(l => l.performance === 'overtime').map(l => l.date),
        undertime: Array.from(dayLogs.values()).filter(l => l.performance === 'undertime').map(l => l.date),
        'on-time': Array.from(dayLogs.values()).filter(l => l.performance === 'on-time').map(l => l.date),
    };

    const modifiersStyles = {
        overtime: { backgroundColor: 'var(--chart-2)', color: 'hsl(var(--primary-foreground))' },
        undertime: { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--primary-foreground))' },
        'on-time': { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance Calendar</CardTitle>
                <CardDescription>View daily work performance. Click a day for details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-center sm:justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-center w-32">
                        {format(month, 'MMMM yyyy')}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-1 border rounded-lg relative">
                    {loading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        </div>
                    )}
                    <Calendar
                        month={month}
                        onMonthChange={onMonthChange}
                        modifiers={modifiers}
                        modifiersStyles={modifiersStyles}
                        className="w-full"
                        components={{
                          DayContent: (props) => {
                            const dayKey = format(props.date, 'yyyy-MM-dd');
                            const dayLog = dayLogs.get(dayKey);
                            if (dayLog) {
                                return (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <div className="relative w-full h-full flex items-center justify-center">
                                          {props.date.getDate()}
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                      <div className="space-y-4">
                                        <div className="space-y-1">
                                          <h4 className="font-medium leading-none">{format(props.date, 'eeee, MMM d')}</h4>
                                          <p className="text-sm text-muted-foreground">Work hours summary</p>
                                        </div>
                                        <Separator/>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Clock In:</span>
                                                <span className="font-medium">{dayLog.clockIn ? format(dayLog.clockIn, 'p') : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Clock Out:</span>
                                                <span className="font-medium">{dayLog.clockOut ? format(dayLog.clockOut, 'p') : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Hours Worked:</span>
                                                <span className="font-medium">{dayLog.hoursWorked.toFixed(2)}h / {employee.standardWorkHours}h</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center font-semibold">
                                                <span>Performance:</span>
                                                <div className={`flex items-center gap-1 ${
                                                  dayLog.performance === 'overtime' ? 'text-green-600' 
                                                  : dayLog.performance === 'undertime' ? 'text-destructive' 
                                                  : ''
                                                }`}>
                                                  {dayLog.performance === 'overtime' && <CheckCircle className="h-4 w-4" />}
                                                  {dayLog.performance === 'undertime' && <AlertCircle className="h-4 w-4" />}
                                                  {dayLog.performance === 'on-time' && <Clock className="h-4 w-4" />}
                                                  <span>{formatDuration(dayLog.minutesDifference)}</span>
                                                </div>
                                            </div>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                );
                            }
                            return <div className="relative w-full h-full flex items-center justify-center">{props.date.getDate()}</div>;
                          }
                        }}
                    />
                </div>

                 <Separator />

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-4 w-4 text-green-500" /> Overtime</p>
                        <p className="text-xl font-bold">{formatTotalDuration(totalOvertime)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><TrendingDown className="h-4 w-4 text-destructive" /> Undertime</p>
                        <p className="text-xl font-bold">{formatTotalDuration(totalUndertime)}</p>
                    </div>
                </div>

                 <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                        On Time
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-2)' }} />
                        Overtime
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                        Undertime
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
