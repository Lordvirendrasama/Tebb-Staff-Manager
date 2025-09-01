'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setEmployeeOfTheWeekAction } from '@/app/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy } from 'lucide-react';
import { USERS, User } from '@/lib/constants';
import type { EmployeeOfTheWeek } from '@/services/awards-service';
import { formatDistanceToNow } from 'date-fns';

export function EmployeeOfTheWeekManager({ employeeOfTheWeek }: { employeeOfTheWeek: EmployeeOfTheWeek | null }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | ''>('');

  const handleAward = () => {
    if (!selectedUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an employee to award.',
      });
      return;
    }
    startTransition(async () => {
      const result = await setEmployeeOfTheWeekAction(selectedUser as User);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  
  return (
    <div className="space-y-4">
        {employeeOfTheWeek && (
            <div className="p-4 border rounded-lg bg-muted/50 text-center">
                <p className="font-bold text-lg">{employeeOfTheWeek.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                    Awarded {formatDistanceToNow(new Date(employeeOfTheWeek.awardedAt), { addSuffix: true })}
                </p>
            </div>
        )}
      <Select onValueChange={(value) => setSelectedUser(value as User)} value={selectedUser} disabled={isPending}>
        <SelectTrigger>
          <SelectValue placeholder="Select an employee" />
        </SelectTrigger>
        <SelectContent>
          {USERS.map((user) => (
            <SelectItem key={user} value={user}>
              {user}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAward} disabled={isPending || !selectedUser} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Awarding...
          </>
        ) : (
          <>
            <Trophy className="mr-2 h-4 w-4" /> Award Badge
          </>
        )}
      </Button>
    </div>
  );
}
