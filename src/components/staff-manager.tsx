
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, UserPlus, Save, Edit, Trash2 } from 'lucide-react';
import type { Employee, WeekDay } from '@/lib/constants';
import { WEEKDAYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { addEmployeeAction, updateEmployeeAction } from '@/app/actions/admin-actions';

export function StaffManager({ employees }: { employees: Employee[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [weeklyOffDay, setWeeklyOffDay] = useState<WeekDay | ''>('');

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingEmployee(null);
    setName('');
    setWeeklyOffDay('');
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsAdding(false);
    setName(employee.name);
    setWeeklyOffDay(employee.weeklyOffDay);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingEmployee(null);
    setName('');
    setWeeklyOffDay('');
  };

  const handleSave = () => {
    if (!name || !weeklyOffDay) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
      return;
    }

    startTransition(async () => {
      const action = editingEmployee ? updateEmployeeAction(editingEmployee.id, name, weeklyOffDay) : addEmployeeAction(name, weeklyOffDay);
      const result = await action;

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        handleCancel();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Management</CardTitle>
        <CardDescription>Add or edit employee details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {employees.map(employee => (
          <div key={employee.id} className="flex items-center justify-between p-2 border rounded-lg">
            <div>
              <p className="font-medium">{employee.name}</p>
              <p className="text-sm text-muted-foreground">{employee.weeklyOffDay}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
              <Edit className="h-4 w-4" />
            </Button>
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
            <Input 
              placeholder="Employee Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
            <Select onValueChange={(value) => setWeeklyOffDay(value as WeekDay)} value={weeklyOffDay} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select Weekly Day Off" />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((day) => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="w-full" disabled={isPending}>Cancel</Button>
              <Button onClick={handleSave} className="w-full" disabled={isPending || !name || !weeklyOffDay}>
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
