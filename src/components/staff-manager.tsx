
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, Save, Edit, Clock, Trash2 } from 'lucide-react';
import type { Employee, WeekDay } from '@/lib/constants';
import { WEEKDAYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { addEmployeeAction, updateEmployeeAction, deleteEmployeeAction } from '@/app/actions/admin-actions';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export function StaffManager({ employees }: { employees: Employee[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [weeklyOffDay, setWeeklyOffDay] = useState<WeekDay | ''>('');
  const [standardWorkHours, setStandardWorkHours] = useState<number | ''>('');

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingEmployee(null);
    setName('');
    setWeeklyOffDay('');
    setStandardWorkHours('');
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsAdding(false);
    setName(employee.name);
    setWeeklyOffDay(employee.weeklyOffDay);
    setStandardWorkHours(employee.standardWorkHours);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingEmployee(null);
    setName('');
    setWeeklyOffDay('');
    setStandardWorkHours('');
  };

  const handleSave = () => {
    if (!name || !weeklyOffDay || !standardWorkHours || standardWorkHours <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields with valid values.' });
      return;
    }

    startTransition(async () => {
      const action = editingEmployee ? 
        updateEmployeeAction(editingEmployee.id, name, weeklyOffDay as WeekDay, standardWorkHours) : 
        addEmployeeAction(name, weeklyOffDay as WeekDay, standardWorkHours);
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
             <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-1 text-sm w-full pr-4">
                <p className="font-medium truncate col-span-1 sm:col-span-1">{employee.name}</p>
                <p className="text-muted-foreground truncate col-span-1 sm:col-span-1">{employee.weeklyOffDay}</p>
                 <div className="flex items-center gap-1 text-muted-foreground truncate col-span-1 sm:col-span-1">
                    <Clock className="h-3 w-3" />
                    <span>{employee.standardWorkHours} hrs/day</span>
                </div>
            </div>
            <div className="flex">
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
            <div className="flex flex-col sm:flex-row gap-2">
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
