
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, Save, Edit, Clock, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import type { Employee, WeekDay, PayFrequency } from '@/lib/constants';
import { WEEKDAYS, PAY_FREQUENCIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { addEmployeeAction, updateEmployeeAction, deleteEmployeeAction } from '@/app/actions/admin-actions';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


export function StaffManager({ employees }: { employees: Employee[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [weeklyOffDay, setWeeklyOffDay] = useState<WeekDay | ''>('');
  const [standardWorkHours, setStandardWorkHours] = useState<number | ''>('');
  const [shiftStartTime, setShiftStartTime] = useState<string>('');
  const [shiftEndTime, setShiftEndTime] = useState<string>('');
  // Payroll fields
  const [baseSalary, setBaseSalary] = useState<number | ''>('');
  const [payFrequency, setPayFrequency] = useState<PayFrequency | ''>('');
  const [payStartDate, setPayStartDate] = useState<Date | undefined>();


  const resetForm = () => {
    setName('');
    setWeeklyOffDay('');
    setStandardWorkHours('');
    setShiftStartTime('');
    setShiftEndTime('');
    setBaseSalary('');
    setPayFrequency('');
    setPayStartDate(undefined);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingEmployee(null);
    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsAdding(false);
    setName(employee.name);
    setWeeklyOffDay(employee.weeklyOffDay);
    setStandardWorkHours(employee.standardWorkHours);
    setShiftStartTime(employee.shiftStartTime || '');
    setShiftEndTime(employee.shiftEndTime || '');
    setBaseSalary(employee.baseSalary || '');
    setPayFrequency(employee.payFrequency || '');
    setPayStartDate(employee.payStartDate ? new Date(employee.payStartDate) : undefined);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingEmployee(null);
    resetForm();
  };

  const handleSave = () => {
    if (!name || !weeklyOffDay || !standardWorkHours || standardWorkHours <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all required employee fields with valid values.' });
      return;
    }

    const employeeData: any = {
      name,
      weeklyOffDay: weeklyOffDay as WeekDay,
      standardWorkHours,
      shiftStartTime,
      shiftEndTime,
      baseSalary: baseSalary || null,
      payFrequency: payFrequency || null,
      payStartDate: payStartDate || null,
    };

    startTransition(async () => {
      const action = editingEmployee ? 
        updateEmployeeAction(editingEmployee.id, employeeData) : 
        addEmployeeAction(employeeData);
      const result = await action;

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        handleCancel();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleDelete = (employeeId: string) => {
    startTransition(async () => {
      const result = await deleteEmployeeAction(employeeId);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Management</CardTitle>
        <CardDescription>Add, edit, or remove employee details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {employees.map(employee => (
          <div key={employee.id} className="flex items-center justify-between p-2 border rounded-lg">
             <div className="flex-1 min-w-0 pr-4 text-sm">
                <p className="font-medium truncate">{employee.name}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                    <span>{employee.weeklyOffDay}</span>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{employee.standardWorkHours} hrs/day</span>
                    </div>
                    {(employee.shiftStartTime && employee.shiftEndTime) && (
                         <div className="flex items-center gap-1">
                            <span>{employee.shiftStartTime} - {employee.shiftEndTime}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)} disabled={isPending}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {employee.name} and all of their associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(employee.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                      {isPending ? <Loader2 className="animate-spin" /> : 'Remove'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {!isAdding && !editingEmployee && (
            <Button onClick={handleAddNew} className="w-full">
                <UserPlus /> Add New Employee
            </Button>
        )}

        {(isAdding || editingEmployee) && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="employee-name">Employee Name</Label>
                  <Input 
                    id="employee-name"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                  />
              </div>
              <div>
                  <Label>Weekly Day Off</Label>
                  <Select onValueChange={(value) => setWeeklyOffDay(value as WeekDay)} value={weeklyOffDay} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div>
                  <Label htmlFor="work-hours">Standard Work Hours/Day</Label>
                  <Input 
                    id="work-hours"
                    type="number"
                    placeholder="e.g. 8"
                    value={standardWorkHours}
                    onChange={(e) => setStandardWorkHours(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isPending}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="shift-start">Shift Start</Label>
                      <Input 
                        id="shift-start"
                        type="time"
                        value={shiftStartTime}
                        onChange={(e) => setShiftStartTime(e.target.value)}
                        disabled={isPending}
                      />
                  </div>
                  <div>
                      <Label htmlFor="shift-end">Shift End</Label>
                      <Input 
                        id="shift-end"
                        type="time"
                        value={shiftEndTime}
                        onChange={(e) => setShiftEndTime(e.target.value)}
                        disabled={isPending}
                      />
                  </div>
              </div>
            </div>
            
            <h5 className="font-medium text-xs text-muted-foreground pt-2">Payroll Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="base-salary">Base Salary (₹)</Label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">₹</span>
                      <Input 
                        id="base-salary"
                        type="number"
                        placeholder="e.g. 30000"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={isPending}
                        className="pl-9"
                      />
                   </div>
              </div>
              <div>
                <Label>Pay Frequency</Label>
                <Select onValueChange={(value) => setPayFrequency(value as PayFrequency)} value={payFrequency} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAY_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq} className="capitalize">{freq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Current Cycle Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !payStartDate && 'text-muted-foreground')}
                      disabled={isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {payStartDate ? format(payStartDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={payStartDate}
                      onSelect={setPayStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={handleCancel} variant="outline" className="w-full" disabled={isPending}>Cancel</Button>
              <Button onClick={handleSave} className="w-full" disabled={isPending || !name || !weeklyOffDay || !standardWorkHours}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
