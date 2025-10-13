
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Square, Timer, Coffee, Save } from 'lucide-react';
import { logEspressoPullAction } from '@/app/actions/espresso-actions';
import type { Employee, User, EspressoDrink } from '@/lib/constants';
import { ESPRESSO_DRINKS } from '@/lib/constants';

const FormSchema = z.object({
  employeeName: z.string().min(1, "Please select an employee."),
  coffeeType: z.enum(ESPRESSO_DRINKS, { required_error: "Please select a coffee type." }),
  coffeeUsed: z.coerce.number().min(1, "Coffee amount must be greater than 0.").max(50, "Coffee amount seems too high."),
});

export function EspressoTracker({ employees }: { employees: Employee[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [timer, setTimer] = useState(0); // Time in milliseconds
  const [isActive, setIsActive] = useState(false);
  const countRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { coffeeUsed: 18 }
  });

  const handleStart = () => {
    setIsActive(true);
    const startTime = Date.now() - timer;
    countRef.current = setInterval(() => {
      setTimer(Date.now() - startTime);
    }, 10);
  };

  const handleStop = () => {
    setIsActive(false);
    if (countRef.current) {
      clearInterval(countRef.current);
    }
  };

  const resetTimer = () => {
    if (countRef.current) {
      clearInterval(countRef.current);
    }
    setIsActive(false);
    setTimer(0);
  };
  
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (timer <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Timer was not run. Please time the pull.' });
        return;
    }

    startTransition(async () => {
        const result = await logEspressoPullAction(
            data.employeeName as User,
            data.coffeeType,
            timer, // Save time in milliseconds
            data.coffeeUsed
        );
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            form.reset({ employeeName: data.employeeName, coffeeType: undefined, coffeeUsed: 18 });
            resetTimer();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }

  const formatTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const milliseconds = Math.floor((timeInMs % 1000) / 10); // get 2 digits for ms
    return `${totalSeconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>New Espresso Pull</CardTitle>
        <CardDescription>Track a new espresso shot.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="employeeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending || isActive}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coffeeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coffee Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending || isActive}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Coffee Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESPRESSO_DRINKS.map(drink => <SelectItem key={drink} value={drink}>{drink}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="coffeeUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coffee Used (grams)</FormLabel>
                   <FormControl>
                     <div className="relative">
                        <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="e.g. 18.5" step="0.01" {...field} className="pl-9" disabled={isPending || isActive} />
                     </div>
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
                <FormLabel>Pull Timer (ss:ms)</FormLabel>
                <Card className="bg-muted/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Timer className="h-6 w-6 text-primary"/>
                            <span className="text-3xl font-mono tracking-widest">{formatTime(timer)}</span>
                        </div>
                        <div className="flex gap-2">
                            {!isActive ? (
                                <Button type="button" size="icon" onClick={handleStart} disabled={isPending || timer > 0}>
                                    <Play />
                                </Button>
                            ) : (
                                <Button type="button" size="icon" onClick={handleStop} variant="destructive">
                                    <Square />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
          </CardContent>
          <CardFooter className="flex-col gap-2">
             <Button type="submit" className="w-full" disabled={isPending || isActive}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Log Pull
            </Button>
            {timer > 0 && !isActive && (
                <Button type="button" variant="outline" className="w-full" onClick={resetTimer}>
                    Reset
                </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
