
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/constants';

interface OvertimeData {
    name: User;
    overtime: number;
}

export function OvertimeTracker({ data }: { data: OvertimeData[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Overtime</CardTitle>
                <CardDescription>Total overtime hours logged this month.</CardDescription>
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
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                            Overtime
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                            {payload[0].value}h
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                )
                            }

                            return null
                            }}
                        />
                        <Bar dataKey="overtime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
