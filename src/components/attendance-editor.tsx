
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Save, Calendar as CalendarIcon } from 'lucide-react';
import { getAttendanceForMonth } from '@/services/client/attendance-service';
import { updateAttendanceForDayAction } from '@/app/actions/attendance-actions';
import { format, getMonth, getYear, setMonth, setYear, isSameDay } from 'date-fns';
import type { Employee, User, AttendanceLog } from '@/lib/constants';
import { formatIST } from '@/lib/date-utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function AttendanceEditor({ employees }: { employees: Employee[] }) {
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendance();
    } else {
      setAttendance([]);
      setSelectedDay(null);
    }
  }, [selectedEmployee, currentMonth]);

  const fetchAttendance = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    setSelectedDay(null); // Reset selection when fetching new data
    try {
      const logs = await getAttendanceForMonth(selectedEmployee, currentMonth);
      setAttendance(logs);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day: Date) => {
    // Prevent selecting days from other months in the calendar view
    if (getMonth(day) !== getMonth(currentMonth)) {
      return;
    }
    
    setSelectedDay(day);
    const logForDay = attendance.find(log => isSameDay(new Date(log.clockIn), day));
    
    if (logForDay) {
        setClockIn(format(new Date(logForDay.clockIn), 'HH:mm'));
        setClockOut(logForDay.clockOut ? format(new Date(logForDay.clockOut), 'HH:mm') : '');
    } else {
        const employeeDetails = employees.find(e => e.name === selectedEmployee);
        setClockIn(employeeDetails?.shiftStartTime || '10:00');
        setClockOut(employeeDetails?.shiftEndTime || '18:00');
    }
  };
  
  const handleSave = () => {
    if (!selectedEmployee || !selectedDay) return;

    startTransition(async () => {
      const result = await updateAttendanceForDayAction(selectedEmployee, selectedDay, clockIn, clockOut);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        fetchAttendance();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedEmployee || !selectedDay) return;

    startTransition(async () => {
        const result = await updateAttendanceForDayAction(selectedEmployee, selectedDay, null, null);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            fetchAttendance();
            setSelectedDay(null);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  };
  
  const workedDays = attendance.map(log => new Date(log.clockIn));

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  const year = getYear(currentMonth);
  const month = getMonth(currentMonth);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Editor</CardTitle>
        <CardDescription>Select an employee to view and edit their attendance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select onValueChange={(value) => setSelectedEmployee(value as User)} value={selectedEmployee || ''}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select Employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={month.toString()} onValueChange={(m) => handleMonthChange(setMonth(currentMonth, parseInt(m)))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    {Array.from({length: 12}, (_, i) => <SelectItem key={i} value={i.toString()}>{format(new Date(0, i), 'MMMM')}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={(y) => handleMonthChange(setYear(currentMonth, parseInt(y)))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    {Array.from({length: 5}, (_, i) => getYear(new Date()) - i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                 {selectedEmployee ? (
                    loading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Calendar
                        mode="single"
                        selected={selectedDay || undefined}
                        onSelect={(day) => day && handleDayClick(day)}
                        month={currentMonth}
                        onMonthChange={handleMonthChange}
                        modifiers={{ worked: workedDays }}
                        modifiersClassNames={{ worked: 'bg-accent/30 rounded-md', selected: 'bg-primary text-primary-foreground' }}
                        className="rounded-md border self-center mx-auto"
                        />
                    )
                 ) : (
                    <div className="flex justify-center items-center h-64 text-muted-foreground border rounded-lg">
                        <p>Please select an employee to see their attendance.</p>
                    </div>
                )}
            </div>

            <div className="md:col-span-1">
                {selectedDay && selectedEmployee ? (
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                <span>{formatIST(selectedDay, 'PPP')}</span>
                            </CardTitle>
                            <CardDescription>Edit attendance for {selectedEmployee}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="clock-in">Clock In Time</Label>
                                <Input id="clock-in" type="time" value={clockIn} onChange={e => setClockIn(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="clock-out">Clock Out Time</Label>
                                <Input id="clock-out" type="time" value={clockOut} onChange={e => setClockOut(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <Button onClick={handleSave} disabled={isPending || !clockIn || !clockOut}>
                                    {isPending ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" />}
                                    Save Changes
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isPending}>
                                            <Trash2 className="mr-2" /> Delete Entry
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the attendance record for this day. This cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                                                {isPending ? <Loader2 className="animate-spin" /> : 'Delete'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground border rounded-lg p-4 text-center">
                        <p>Select a day from the calendar to view or edit attendance details.</p>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
