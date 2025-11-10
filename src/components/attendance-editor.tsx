
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { getAttendanceForMonth } from '@/services/client/attendance-service';
import { updateAttendanceForDayAction } from '@/app/actions/attendance-actions';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import type { Employee, User, AttendanceLog } from '@/lib/constants';

export function AttendanceEditor({ employees }: { employees: Employee[] }) {
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendance();
    } else {
      setAttendance([]);
    }
  }, [selectedEmployee, currentMonth]);

  const fetchAttendance = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
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
    const logForDay = attendance.find(log => new Date(log.clockIn).toDateString() === day.toDateString());
    setSelectedDay(day);

    if (logForDay) {
        setClockIn(format(new Date(logForDay.clockIn), 'HH:mm'));
        setClockOut(logForDay.clockOut ? format(new Date(logForDay.clockOut), 'HH:mm') : '');
    } else {
        const employeeDetails = employees.find(e => e.name === selectedEmployee);
        setClockIn(employeeDetails?.shiftStartTime || '10:00');
        setClockOut(employeeDetails?.shiftEndTime || '18:00');
    }
    setIsDialogOpen(true);
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
      setIsDialogOpen(false);
    });
  };

  const handleDelete = () => {
    if (!selectedEmployee || !selectedDay) return;

    startTransition(async () => {
        const result = await updateAttendanceForDayAction(selectedEmployee, selectedDay, null, null);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            fetchAttendance();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsDialogOpen(false);
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

        {selectedEmployee ? (
          loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Calendar
              mode="single"
              onDayClick={handleDayClick}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              modifiers={{ worked: workedDays }}
              modifiersStyles={{ worked: { border: '2px solid var(--color-accent)', backgroundColor: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius)' } }}
              className="rounded-md border self-center"
            />
          )
        ) : (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            <p>Please select an employee to see their attendance.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>
              {selectedDay && `Editing for ${selectedEmployee} on ${format(selectedDay, 'PPP')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clock-in" className="text-right">Clock In</Label>
              <Input id="clock-in" type="time" value={clockIn} onChange={e => setClockIn(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clock-out" className="text-right">Clock Out</Label>
              <Input id="clock-out" type="time" value={clockOut} onChange={e => setClockOut(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isPending || !clockIn || !clockOut}>
                    {isPending && <Loader2 className="animate-spin mr-2" />}
                    Save
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
