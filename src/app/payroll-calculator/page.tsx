
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PartyPopper, RefreshCw, Calculator, CalendarIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isAfter, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const getDaysInCurrentMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const payrollSchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required'),
  monthlySalary: z.coerce.number().positive('Salary must be a positive number'),
  payPeriod: z.object({
    from: z.date({ required_error: 'Pay period start date is required.' }),
    to: z.date({ required_error: 'Pay period end date is required.' }),
  }),
  joiningDate: z.date({ required_error: 'Joining date is required.' }),
  weeklyOffsPerWeek: z.coerce.number().int().min(0).max(7),
  actualDaysWorked: z.coerce.number().int().min(0, 'Days worked cannot be negative'),
}).refine(data => data.actualDaysWorked <= differenceInDays(data.payPeriod.to, data.payPeriod.from) + 1, {
    message: "Days worked cannot exceed days in the pay period",
    path: ["actualDaysWorked"],
});

type PayrollFormInputs = z.infer<typeof payrollSchema>;

interface PayrollResults {
    employeeName: string;
    monthlySalary: number;
    payPeriod: DateRange;
    joiningDate: Date;
    totalDaysInPeriod: number;
    payableDays: number;
    weeklyOffs: number;
    standardWorkingDays: number;
    daysWorked: number;
    perDayRate: number;
    finalPay: number;
    summary: string;
}

export default function PayrollCalculatorPage() {
    const [results, setResults] = useState<PayrollResults | null>(null);

    const defaultPayPeriod = {
        from: startOfDay(new Date(new Date().setDate(1))),
        to: endOfDay(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
    };

    const form = useForm<PayrollFormInputs>({
        resolver: zodResolver(payrollSchema),
        defaultValues: {
            employeeName: '',
            monthlySalary: 0,
            payPeriod: defaultPayPeriod,
            joiningDate: defaultPayPeriod.from,
            weeklyOffsPerWeek: 1,
            actualDaysWorked: 0,
        },
    });

    const onSubmit: SubmitHandler<PayrollFormInputs> = (data) => {
        const totalDaysInPeriod = differenceInDays(data.payPeriod.to, data.payPeriod.from) + 1;
        
        const effectiveStartDate = isAfter(data.joiningDate, data.payPeriod.from) ? data.joiningDate : data.payPeriod.from;
        const payableDays = differenceInDays(data.payPeriod.to, effectiveStartDate) + 1;
        
        const weeksInMonth = totalDaysInPeriod / 7;
        const totalWeeklyOffs = Math.floor(weeksInMonth) * data.weeklyOffsPerWeek;
        const standardWorkingDays = totalDaysInPeriod - totalWeeklyOffs;

        if (standardWorkingDays <= 0) {
            form.setError('payPeriod', {
                type: 'manual',
                message: 'Calculated working days is zero or less. Check inputs.',
            });
            return;
        }

        const perDayRate = data.monthlySalary / standardWorkingDays;
        
        const actualDaysWorkedInPayablePeriod = Math.min(data.actualDaysWorked, payableDays);
        const finalPay = perDayRate * actualDaysWorkedInPayablePeriod;

        setResults({
            employeeName: data.employeeName,
            monthlySalary: data.monthlySalary,
            payPeriod: data.payPeriod,
            joiningDate: data.joiningDate,
            totalDaysInPeriod,
            payableDays: actualDaysWorkedInPayablePeriod,
            weeklyOffs: totalWeeklyOffs,
            standardWorkingDays,
            daysWorked: data.actualDaysWorked,
            perDayRate,
            finalPay,
            summary: `${data.employeeName} worked ${actualDaysWorkedInPayablePeriod} out of ${standardWorkingDays} working days in the period. Their calculated pay is ₹${finalPay.toFixed(2)}.`,
        });
    };
    
    const handleReset = () => {
        form.reset();
        setResults(null);
    };
    
    const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Payroll Calculator</h2>
                <p className="text-muted-foreground">A simple tool to calculate employee pay.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Enter Details</CardTitle>
                        <CardDescription>Provide the details to calculate the final pay.</CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="employeeName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employee Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Viren" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="monthlySalary"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monthly Salary (₹)</FormLabel>
                                            <FormControl><Input type="number" placeholder="e.g., 30000" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="payPeriod"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Pay Period</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value.from && 'text-muted-foreground')}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value.from ? `${format(field.value.from, 'PPP')} - ${field.value.to ? format(field.value.to, 'PPP') : ''}` : <span>Pick a date range</span>}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="range" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="joiningDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Joining Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="weeklyOffsPerWeek"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Weekly Offs</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="actualDaysWorked"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Days Worked</FormLabel>
                                                <FormControl><Input type="number" placeholder="e.g., 25" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col gap-4">
                                <Button type="submit" className="w-full">
                                    <Calculator className="mr-2 h-4 w-4" /> Calculate Pay
                                </Button>
                                {results && (
                                     <Button type="button" variant="outline" className="w-full" onClick={handleReset}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Reset
                                    </Button>
                                )}
                            </CardFooter>
                        </form>
                    </Form>
                </Card>

                {results ? (
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>Calculation Results</CardTitle>
                            <CardDescription>Summary of the payroll calculation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-2 p-4 border rounded-lg bg-background">
                                <div className="flex justify-between"><span>Employee:</span> <span className="font-medium">{results.employeeName}</span></div>
                                <div className="flex justify-between"><span>Monthly Salary:</span> <span className="font-medium">{formatCurrency(results.monthlySalary)}</span></div>
                                <div className="flex justify-between"><span>Pay Period:</span> <span className="font-medium text-right">{`${format(results.payPeriod.from!, 'dd MMM')} - ${format(results.payPeriod.to!, 'dd MMM yyyy')}`}</span></div>
                                <Separator />
                                <div className="flex justify-between"><span>Total Days in Period:</span> <span className="font-medium">{results.totalDaysInPeriod}</span></div>
                                <div className="flex justify-between"><span>Total Weekly Offs:</span> <span className="font-medium">{results.weeklyOffs}</span></div>
                                <div className="flex justify-between"><span>Standard Working Days:</span> <span className="font-medium">{results.standardWorkingDays}</span></div>
                                 <div className="flex justify-between"><span>Payable Days (post-join):</span> <span className="font-medium">{results.payableDays}</span></div>
                                <div className="flex justify-between"><span>Actual Days Worked:</span> <span className="font-medium">{results.daysWorked}</span></div>
                                <Separator />
                                <div className="flex justify-between"><span>Per Day Rate:</span> <span className="font-medium">{formatCurrency(results.perDayRate)}</span></div>
                            </div>
                            
                            <Alert className="border-primary/50 text-primary-foreground bg-primary">
                                <PartyPopper className="h-5 w-5 text-primary-foreground" />
                                <AlertTitle className="font-headline text-lg text-primary-foreground">Final Pay: {formatCurrency(results.finalPay)}</AlertTitle>
                            </Alert>

                            <Alert variant="default" className="text-center">
                                <AlertDescription>{results.summary}</AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                        <Calculator className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Results will be displayed here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
