
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { onEspressoLogsSnapshot } from '@/services/client/espresso-service';
import type { EspressoLog } from '@/lib/constants';
import { Trophy, Zap, Coffee, Flame, ThumbsUp, Frown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    perfect: { label: 'Perfect', icon: <ThumbsUp className="h-4 w-4 text-green-500" />, description: '22-33 seconds' },
    gettingThere: { label: 'Getting There', icon: <Zap className="h-4 w-4 text-yellow-500" />, description: '19-22 seconds' },
    needsWork: { label: 'Needs Work', icon: <Coffee className="h-4 w-4 text-orange-500" />, description: '13-18 seconds' },
    burnt: { label: 'Burnt', icon: <Flame className="h-4 w-4 text-red-500" />, description: '33+ seconds' },
    unservable: { label: 'Unservable', icon: <Frown className="h-4 w-4 text-gray-500" />, description: '0-12 seconds' },
};


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
        if (index === 0) return <span className="text-2xl" role="img" aria-label="gold medal">🥇</span>;
        if (index === 1) return <span className="text-2xl" role="img" aria-label="silver medal">🥈</span>;
        if (index === 2) return <span className="text-2xl" role="img" aria-label="bronze medal">🥉</span>;
        return <span className="text-muted-foreground font-bold">{index + 1}</span>;
    };

    if (loading) {
        return (
            <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Espresso Masters</h2>
                    <p className="text-muted-foreground mt-2">Ranking of baristas by perfect pulls (22-33 seconds).</p>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                             <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-6 flex-grow" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center justify-center gap-3">
                    <Trophy className="h-8 w-8 text-primary" />
                    Espresso Masters
                </h2>
                <p className="text-muted-foreground mt-2">Ranking of baristas by the number of perfect pulls and detailed analytics.</p>
            </div>

            <Card className="shadow-lg">
                <CardContent className="p-4 md:p-6">
                    {leaderboardData.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {leaderboardData.map((entry, index) => (
                                <AccordionItem value={entry.employeeName} key={entry.employeeName}>
                                    <AccordionTrigger className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors w-full">
                                        <div className="w-8 text-center text-xl font-headline">
                                            {getMedal(index)}
                                        </div>
                                        <div className="flex-grow text-left">
                                            <p className="text-lg font-medium">{entry.employeeName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-primary">{entry.stats.perfect}</p>
                                            <p className="text-xs text-muted-foreground">Perfect Pulls</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-muted/30 rounded-b-lg">
                                        <h4 className="font-semibold mb-3 text-center">Pull Analytics ({entry.stats.total} total)</h4>
                                        <ul className="space-y-2 text-sm">
                                            {Object.entries(pullCategories).map(([key, value]) => {
                                                const statKey = key as keyof PullStats;
                                                const count = entry.stats[statKey];
                                                const percentage = entry.stats.total > 0 ? ((count / entry.stats.total) * 100).toFixed(0) : 0;
                                                return (
                                                    <li key={key} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {value.icon}
                                                            <div>
                                                                <span className="font-medium">{value.label}</span>
                                                                <span className="text-xs text-muted-foreground ml-2">({value.description})</span>
                                                            </div>
                                                        </div>
                                                        <span className="font-mono text-right">{count} <span className="text-muted-foreground text-xs">({percentage}%)</span></span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center py-16">
                            <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="font-semibold">No Perfect Pulls Yet</h3>
                            <p className="text-sm text-muted-foreground">Start logging espresso shots to climb the leaderboard!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
