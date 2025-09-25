
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import type { Employee, AttendanceLog } from '@/lib/constants';
import { getAttendanceForMonth } from '@/services/client/attendance-service';
import { updateAttendanceForDayAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { addMonths, format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function AttendanceEditor({ employees }: { employees: Employee[] }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const [workedDays, setWorkedDays] = useState<Date[]>([]);
    const [loading, setLoading] = useState(false);
    const [isUpdating, startUpdateTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        if (selectedEmployeeId) {
            setLoading(true);
            const employee = employees.find(e => e.id === selectedEmployeeId);
            if(employee){
                getAttendanceForMonth(employee.name, currentMonth).then(logs => {
                    setWorkedDays(logs.map(log => new Date(log.clockIn)));
                    setLoading(false);
                });
            }
        }
    }, [selectedEmployeeId, currentMonth, employees]);

    const handleDayClick = (day: Date | undefined) => {
        if (!day || !selectedEmployeeId) return;

        const isWorked = workedDays.some(d => d.toDateString() === day.toDateString());
        
        // Optimistic UI update
        if (isWorked) {
            setWorkedDays(prev => prev.filter(d => d.toDateString() !== day.toDateString()));
        } else {
            setWorkedDays(prev => [...prev, day]);
        }
        
        startUpdateTransition(async () => {
            const result = await updateAttendanceForDayAction(selectedEmployeeId, day, !isWorked);
            
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
                // Revert optimistic update on failure
                if (isWorked) {
                    setWorkedDays(prev => [...prev, day]);
                } else {
                    setWorkedDays(prev => prev.filter(d => d.toDateString() !== day.toDateString()));
                }
            }
        });
    };

    const changeMonth = (offset: number) => {
        setCurrentMonth(prev => addMonths(prev, offset));
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance Editor</CardTitle>
                <CardDescription>Select an employee and click on a day to mark it as worked or not worked.</CardDescription>
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
                    {(loading) && (
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
                            mode="multiple"
                            selected={workedDays}
                            onDayClick={handleDayClick}
                            className="w-full"
                        />
                     )}
                </div>
            </CardContent>
        </Card>
    );
}
