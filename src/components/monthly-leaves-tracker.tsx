
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/constants';

interface MonthlyLeavesData {
    name: User;
    leaves: number;
}

export function MonthlyLeavesTracker({ data }: { data: MonthlyLeavesData[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Leaves</CardTitle>
                <CardDescription>Total leave days taken this month.</CardDescription>
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
                            tickFormatter={(value) => `${value}d`}
                            allowDecimals={false}
                        />
                        <Bar dataKey="leaves" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
