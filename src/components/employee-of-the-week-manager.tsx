'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USERS, type User } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { setEmployeeOfTheWeekAction } from '@/app/actions/admin-actions';
import { Loader2, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function EmployeeOfTheWeekManager({ currentEmployee }: { currentEmployee: User | null }) {
  const [selectedEmployee, setSelectedEmployee] = useState<User | ''>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSetEmployee = () => {
    if (!selectedEmployee) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an employee.',
      });
      return;
    }

    startTransition(async () => {
      const result = await setEmployeeOfTheWeekAction(selectedEmployee as User);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  return (
    <div className="space-y-4">
       {currentEmployee && (
        <div className="p-4 border rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Current Employee of the Week</p>
            <p className="text-lg font-semibold text-primary">{currentEmployee}</p>
        </div>
       )}
      <div className="flex items-center gap-4">
        <Select onValueChange={(value) => setSelectedEmployee(value as User)} value={selectedEmployee} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            {USERS.map((user) => (
              <SelectItem key={user} value={user}>
                {user}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSetEmployee} disabled={isPending || !selectedEmployee}>
          {isPending ? <Loader2 className="animate-spin" /> : <Award />}
          Set
        </Button>
      </div>
    </div>
  );
}
