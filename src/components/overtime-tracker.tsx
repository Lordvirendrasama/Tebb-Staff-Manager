'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/constants';

interface WorkPerformanceData {
    name: User;
    overtime: number;
    undertime: number;
}

export function WorkPerformanceTracker({ data }: { data: WorkPerformanceData[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Work Performance</CardTitle>
                <CardDescription>Total overtime and undertime hours this month.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}h`}
                        />
                         <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-green-500">
                                            Overtime
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                            {payload.find(p => p.dataKey === 'overtime')?.value || 0}h
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-destructive">
                                            Undertime
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                            {payload.find(p => p.dataKey === 'undertime')?.value || 0}h
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                )
                            }

                            return null
                            }}
                        />
                        <Legend wrapperStyle={{fontSize: "0.75rem"}}/>
                        <Bar dataKey="overtime" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Overtime" />
                        <Bar dataKey="undertime" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Undertime" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
