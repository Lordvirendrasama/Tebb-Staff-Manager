
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import type { Employee } from '@/lib/constants';
import { getAttendanceForMonth } from '@/services/client/attendance-service';
import { updateAttendanceForRangeAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { addMonths, format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, X, Check } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

export function AttendanceEditor({ employees }: { employees: Employee[] }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const [workedDays, setWorkedDays] = useState<Date[]>([]);
    const [range, setRange] = useState<DateRange | undefined>();
    
    const [loading, setLoading] = useState(false);
    const [isUpdating, startUpdateTransition] = useTransition();
    const { toast } = useToast();

    const employee = employees.find(e => e.id === selectedEmployeeId);

    useEffect(() => {
        if (selectedEmployeeId && employee) {
            setLoading(true);
            getAttendanceForMonth(employee.name, currentMonth).then(logs => {
                setWorkedDays(logs.map(log => new Date(log.clockIn)));
                setLoading(false);
            });
        } else {
            setWorkedDays([]);
        }
        setRange(undefined);
    }, [selectedEmployeeId, currentMonth, employee]);

    const handleRangeUpdate = (worked: boolean) => {
        if (!range?.from || !range.to || !selectedEmployeeId) return;

        startUpdateTransition(async () => {
            const result = await updateAttendanceForRangeAction(selectedEmployeeId, range.from!, range.to!, worked);
            
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                if (employee) {
                    setLoading(true);
                     getAttendanceForMonth(employee.name, currentMonth).then(logs => {
                        setWorkedDays(logs.map(log => new Date(log.clockIn)));
                        setLoading(false);
                    });
                }
                setRange(undefined);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const changeMonth = (offset: number) => {
        setCurrentMonth(prev => addMonths(prev, offset));
    };

    const modifiers = {
        worked: workedDays,
    };

    const modifiersStyles = {
        worked: {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
        },
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance Editor</CardTitle>
                <CardDescription>Select a date range to mark days as worked or not worked.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium text-center w-32">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-1 border rounded-lg relative">
                    {(loading || isUpdating) && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        </div>
                    )}
                     {!selectedEmployeeId ? (
                        <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                            Please select an employee to view their attendance.
                        </div>
                     ) : (
                        <Calendar
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            mode="range"
                            selected={range}
                            onSelect={setRange}
                            modifiers={modifiers}
                            modifiersStyles={modifiersStyles}
                            className="w-full"
                        />
                     )}
                </div>

                {range?.from && (
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-3">
                           <div className="text-sm font-medium">
                                Update range: {format(range.from, "PPP")} {range.to && ` - ${format(range.to, "PPP")}`}
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" onClick={() => setRange(undefined)}>
                                    <X className="mr-2 h-4 w-4" /> Clear
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRangeUpdate(false)} disabled={!range.to}>
                                    <X className="mr-2 h-4 w-4" /> Mark as Not Worked
                                </Button>
                                <Button size="sm" onClick={() => handleRangeUpdate(true)} disabled={!range.to}>
                                    <Check className="mr-2 h-4 w-4" /> Mark as Worked
                                </Button>
                           </div>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    );
}
