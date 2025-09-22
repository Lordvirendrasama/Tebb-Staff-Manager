
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { User, LeaveRequest, LeaveType } from '@/lib/constants';
import { LEAVE_TYPES } from '@/lib/constants';
import { requestLeaveAction } from '@/app/actions/attendance-actions';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';


const FormSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  leaveType: z.enum(LEAVE_TYPES),
  reason: z.string().min(5, "Reason must be at least 5 characters long."),
});

export function LeaveTracker({ user, history }: { user: User; history: LeaveRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reason: '',
    },
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    startTransition(async () => {
      const result = await requestLeaveAction(user, data.dateRange.from, data.dateRange.to, data.reason, data.leaveType as LeaveType);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        form.reset();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Denied': return 'destructive';
        default: return 'outline';
    }
  };

  const formatDateRange = (start?: Date, end?: Date) => {
    if (!isClient) return '...';
    if (!start) return '';
    if (!end || format(start, 'PPP') === format(end, 'PPP')) return format(start, 'PPP');
    return `${format(start, 'PPP')} to ${format(end, 'PPP')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Leave</CardTitle>
          <CardDescription>Submit a new leave request.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Leave Dates</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                            disabled={isPending}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                                formatDateRange(field.value.from, field.value.to)
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAVE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Family event" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>Your recent leave requests.</CardDescription>
        </CardHeader>
        <CardContent>
             {history.length > 0 ? (
                <ScrollArea className="h-72 w-full">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map(request => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              <div className="truncate">{isClient ? formatDateRange(request.startDate, request.endDate) : '...'}</div>
                              <div className="text-xs text-muted-foreground truncate">{request.leaveType}</div>
                            </TableCell>
                            <TableCell className="text-right">
                               <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </ScrollArea>
             ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No leave requests yet.</p>
             )}
        </CardContent>
      </Card>
    </div>
  );
}
