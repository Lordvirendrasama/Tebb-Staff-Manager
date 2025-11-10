
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { onEspressoLogsSnapshot } from '@/services/client/espresso-service';
import type { EspressoLog } from '@/lib/constants';
import { Trophy, Zap, Coffee, Flame, ThumbsUp, Frown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface PullStats {
    unservable: number;
    needsWork: number;
    gettingThere: number;
    perfect: number;
    burnt: number;
    total: number;
}

interface LeaderboardEntry {
    employeeName: string;
    stats: PullStats;
}

const pullCategories = {
    perfect: { label: 'Perfect', icon: ThumbsUp, color: 'hsl(var(--chart-1))', description: '22-33s' },
    gettingThere: { label: 'Getting There', icon: Zap, color: 'hsl(var(--chart-2))', description: '19-22s' },
    needsWork: { label: 'Needs Work', icon: Coffee, color: 'hsl(var(--chart-3))', description: '13-18s' },
    burnt: { label: 'Burnt', icon: Flame, color: 'hsl(var(--chart-4))', description: '33+s' },
    unservable: { label: 'Unservable', icon: Frown, color: 'hsl(var(--chart-5))', description: '0-12s' },
};

const chartConfig = Object.fromEntries(
  Object.entries(pullCategories).map(([key, value]) => [
    key,
    { label: value.label, color: value.color },
  ])
) as ChartConfig;


export default function LeaderboardPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<EspressoLog[]>([]);

    useEffect(() => {
        const unsubscribe = onEspressoLogsSnapshot(
            (fetchedLogs) => {
                setLogs(fetchedLogs);
                setLoading(false);
            },
            (error) => {
                console.error("Failed to fetch espresso logs:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const leaderboardData: LeaderboardEntry[] = useMemo(() => {
        const employeeStats: Record<string, PullStats> = {};

        logs.forEach(log => {
            if (!employeeStats[log.employeeName]) {
                employeeStats[log.employeeName] = { unservable: 0, needsWork: 0, gettingThere: 0, perfect: 0, burnt: 0, total: 0 };
            }

            const stats = employeeStats[log.employeeName];
            const timeInSeconds = log.timeTaken > 1000 ? log.timeTaken / 1000 : log.timeTaken;
            
            stats.total++;

            if (timeInSeconds >= 22 && timeInSeconds <= 33) {
                stats.perfect++;
            } else if (timeInSeconds >= 19 && timeInSeconds < 22) {
                stats.gettingThere++;
            } else if (timeInSeconds >= 13 && timeInSeconds < 19) {
                stats.needsWork++;
            } else if (timeInSeconds > 33) {
                stats.burnt++;
            } else {
                stats.unservable++;
            }
        });
        
        return Object.entries(employeeStats)
            .map(([employeeName, stats]) => ({ employeeName, stats }))
            .sort((a, b) => b.stats.perfect - a.stats.perfect);

    }, [logs]);

    const getMedal = (index: number) => {
        if (index === 0) return <span className="text-3xl" role="img" aria-label="gold medal">🥇</span>;
        if (index === 1) return <span className="text-3xl" role="img" aria-label="silver medal">🥈</span>;
        if (index === 2) return <span className="text-3xl" role="img" aria-label="bronze medal">🥉</span>;
        return <span className="text-muted-foreground font-bold text-xl">{index + 1}</span>;
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center justify-center gap-3">
                      <Trophy className="h-8 w-8 text-primary" />
                      Espresso Masters
                  </h2>
                  <p className="text-muted-foreground mt-2">Ranking of baristas by the number of perfect pulls and detailed analytics.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}><CardHeader><Skeleton className="h-8 w-32" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center justify-center gap-3">
                    <Trophy className="h-8 w-8 text-primary" />
                    Espresso Masters
                </h2>
                <p className="text-muted-foreground mt-2">Ranking of baristas by the number of perfect pulls and detailed analytics.</p>
            </div>

            {leaderboardData.length > 0 ? (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {leaderboardData.map((entry, index) => {
                        const chartData = Object.entries(pullCategories).map(([key, value]) => ({
                            name: value.label,
                            value: entry.stats[key as keyof PullStats],
                            fill: value.color,
                        })).filter(d => d.value > 0);

                        return (
                            <Card key={entry.employeeName} className="flex flex-col h-full shadow-lg">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className="w-10 text-center">{getMedal(index)}</div>
                                    <div>
                                        <CardTitle className="text-2xl font-headline">{entry.employeeName}</CardTitle>
                                        <CardDescription>{entry.stats.perfect} Perfect Pulls</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-center">
                                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Tooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent hideLabel indicator="dot" nameKey="name" />}
                                                />
                                                <Pie
                                                    data={chartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={60}
                                                    strokeWidth={5}
                                                >
                                                    {chartData.map((d) => (
                                                        <Cell key={d.name} fill={d.fill} />
                                                    ))}
                                                </Pie>
                                                <Legend
                                                    content={({ payload }) => {
                                                        return (
                                                            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
                                                                {payload?.map((item) => {
                                                                    const categoryKey = Object.keys(pullCategories).find(
                                                                        (key) => pullCategories[key as keyof typeof pullCategories].label === item.value
                                                                    ) as keyof typeof pullCategories | undefined;

                                                                    if (!categoryKey) return null;
                                                                    
                                                                    const { label, icon: Icon } = pullCategories[categoryKey];
                                                                    const pullData = chartData.find(d => d.name === item.value);
                                                                    const percentage = entry.stats.total > 0 ? ((pullData?.value || 0) / entry.stats.total * 100).toFixed(0) : 0;

                                                                    return (
                                                                        <li key={item.value} className="flex items-center gap-2">
                                                                            <Icon className="h-5 w-5" style={{color: item.color}} />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{label}</span>
                                                                                <div>
                                                                                    <span className="font-mono text-base">{pullData?.value}</span>
                                                                                    <span className="text-muted-foreground text-xs ml-1">({percentage}%)</span>
                                                                                </div>
                                                                            </div>
                                                                        </li>
                                                                    )
                                                                })}
                                                            </ul>
                                                        )
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-24 border-2 border-dashed rounded-lg">
                    <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold">No Espresso Pulls Logged Yet</h3>
                    <p className="text-muted-foreground mt-2">Start using the Espresso Tracker to climb the leaderboard!</p>
                </div>
            )}
        </div>
    );
}
