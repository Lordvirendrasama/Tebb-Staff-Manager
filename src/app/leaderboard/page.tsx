
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
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';
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

const getPerformanceRank = (score: number) => {
    if (score >= 90) return { rank: 'S', color: 'hsl(var(--rank-s))' };
    if (score >= 75) return { rank: 'A', color: 'hsl(var(--rank-a))' };
    if (score >= 60) return { rank: 'B', color: 'hsl(var(--rank-b))' };
    return { rank: 'C', color: 'hsl(var(--rank-c))' };
}

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
        if (index === 0) return { medal: '🥇', shadow: 'shadow-[0_0_20px_gold]', sparkle: true };
        if (index === 1) return { medal: '🥈', shadow: 'shadow-[0_0_20px_silver]', sparkle: false };
        if (index === 2) return { medal: '🥉', shadow: 'shadow-[0_0_20px_#CD7F32]', sparkle: false };
        return { medal: `#${index + 1}`, shadow: '', sparkle: false };
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center justify-center gap-3">
                      <Trophy className="h-8 w-8 text-primary" />
                      Espresso Masters
                  </h2>
                  <p className="text-muted-foreground mt-2">The official performance analytics dashboard.</p>
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
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center justify-center gap-3">
                    <Trophy className="h-8 w-8 text-primary" />
                    Espresso Masters
                </h2>
                <p className="text-muted-foreground mt-2">The official performance analytics dashboard.</p>
            </motion.div>

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
                        const { medal, shadow, sparkle } = getMedal(index);
                        const { rank, color: rankColor } = getPerformanceRank(entry.performanceScore);
                        const userImage = placeholderImages.users.find(u => u.name === entry.employeeName)?.image || placeholderImages.users.find(u => u.name === 'default')?.image;

                        return (
                            <motion.div
                                key={entry.employeeName}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="h-full"
                            >
                                <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                                    <CardHeader className="p-4 pb-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                 <div className="relative">
                                                    {userImage && (
                                                        <Image src={userImage.src} alt={entry.employeeName} width={64} height={64} className="rounded-full border-2 border-border" data-ai-hint={userImage['data-ai-hint']} />
                                                    )}
                                                    <span className={cn("absolute -bottom-2 -right-2 text-3xl", shadow)}>{medal}</span>
                                                    {sparkle && <Star className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 sparkle" fill="currentColor" />}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl font-headline">{entry.employeeName}</CardTitle>
                                                    <p className="text-sm text-muted-foreground"><AnimatedCounter value={entry.stats.perfect} /> Perfect Pulls</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-3xl">
                                                    <AnimatedCounter value={Math.round(entry.performanceScore)} />
                                                </div>
                                                <Badge style={{ backgroundColor: rankColor, color: 'white' }} className="text-xs">{rank} Rank</Badge>
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
                            </motion.div>
                        )
                    })}
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center justify-center text-center py-24 border-2 border-dashed rounded-lg">
                    <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold">No Espresso Pulls Logged Yet</h3>
                    <p className="text-muted-foreground mt-2">Start using the Espresso Tracker to climb the leaderboard!</p>
                </motion.div>
            )}
        </div>
    );
}
