
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { onEspressoLogsSnapshot } from '@/services/client/espresso-service';
import type { EspressoLog } from '@/lib/constants';
import { Trophy, Zap, Coffee, Flame, ThumbsUp, Frown, Star } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/lib/placeholder-images.json';

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
    performanceScore: number;
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

            if (timeInSeconds >= 22 && timeInSeconds <= 33) stats.perfect++;
            else if (timeInSeconds >= 19 && timeInSeconds < 22) stats.gettingThere++;
            else if (timeInSeconds >= 13 && timeInSeconds < 19) stats.needsWork++;
            else if (timeInSeconds > 33) stats.burnt++;
            else stats.unservable++;
        });
        
        return Object.entries(employeeStats)
            .map(([employeeName, stats]) => {
                const performanceScore = stats.total > 0 ? (stats.perfect / stats.total) * 100 : 0;
                return { employeeName, stats, performanceScore };
            })
            .sort((a, b) => b.stats.perfect - a.stats.perfect || b.performanceScore - a.performanceScore);

    }, [logs]);

    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="text-center">
                  <Trophy className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                      Leaderboard
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}><CardHeader><Skeleton className="h-8 w-32" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <Trophy className="h-10 w-10 text-primary mx-auto mb-2" />
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                    Leaderboard
                </h2>
                <p className="text-muted-foreground mt-2">The official performance analytics dashboard.</p>
            </div>

            {leaderboardData.length > 0 ? (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                    {leaderboardData.map((entry, index) => {
                        const chartData = Object.entries(entry.stats)
                            .filter(([key, value]) => key !== 'total' && value > 0)
                            .map(([key, value]) => ({
                                name: key as keyof PullStats,
                                value,
                                fill: pullCategories[key as keyof typeof pullCategories].color,
                            }));
                        const medal = getMedal(index);
                        
                        return (
                            <div
                                key={entry.employeeName}
                                className="h-full"
                            >
                                <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                                    <CardHeader className="p-4 pb-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-xl font-headline">{entry.employeeName}</CardTitle>
                                                <p className="text-sm text-muted-foreground"><span>{entry.stats.perfect}</span> Perfect Pulls</p>
                                            </div>
                                            <div className="text-right">
                                                 <div className="flex items-center justify-end gap-2">
                                                    <span className="text-3xl">{medal}</span>
                                                    <div className="font-bold text-3xl">
                                                        <span>{Math.round(entry.performanceScore)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center items-center p-4">
                                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Tooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="dot" nameKey="name" />} />
                                                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} strokeWidth={2}>
                                                        {chartData.map((d, i) => (
                                                            <Cell key={`cell-${i}`} fill={d.fill} className="stroke-background" />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                        
                                        <div className="w-full mt-4">
                                            <ul className="text-xs space-y-1">
                                                {Object.entries(pullCategories).map(([key, config]) => {
                                                    const statValue = entry.stats[key as keyof PullStats];
                                                    const percentage = entry.stats.total > 0 ? (statValue / entry.stats.total * 100).toFixed(0) : 0;
                                                    return (
                                                         <li key={key} className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <config.icon className="h-4 w-4" style={{ color: config.color }} />
                                                                <span>{config.label} <span className="text-muted-foreground">({config.description})</span></span>
                                                            </div>
                                                            <div className="font-mono text-right">
                                                                <span className="font-semibold">{statValue}</span>
                                                                <span className="ml-2 text-muted-foreground">({percentage}%)</span>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>

                                    </CardContent>
                                </Card>
                            </div>
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
