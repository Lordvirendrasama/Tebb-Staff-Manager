
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { onEspressoLogsSnapshot } from '@/services/client/espresso-service';
import type { EspressoLog } from '@/lib/constants';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
    employeeName: string;
    perfectPulls: number;
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

    const leaderboardData = useMemo(() => {
        const perfectPullCounts: Record<string, number> = {};

        logs.forEach(log => {
            // Heuristic: If time is less than 1000, it's likely an old log in seconds.
            const timeInSeconds = log.timeTaken > 1000 ? log.timeTaken / 1000 : log.timeTaken;
            
            if (timeInSeconds >= 22 && timeInSeconds <= 33) {
                if (!perfectPullCounts[log.employeeName]) {
                    perfectPullCounts[log.employeeName] = 0;
                }
                perfectPullCounts[log.employeeName]++;
            }
        });
        
        return Object.entries(perfectPullCounts)
            .map(([employeeName, perfectPulls]) => ({ employeeName, perfectPulls }))
            .sort((a, b) => b.perfectPulls - a.perfectPulls);

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
                <p className="text-muted-foreground mt-2">Ranking of baristas by the number of perfect pulls (22-33 seconds).</p>
            </div>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    {leaderboardData.length > 0 ? (
                        <ol className="space-y-4">
                            {leaderboardData.map((entry, index) => (
                                <li key={entry.employeeName} className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                    <div className="w-8 text-center text-xl font-headline">
                                        {getMedal(index)}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-lg font-medium">{entry.employeeName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-primary">{entry.perfectPulls}</p>
                                        <p className="text-xs text-muted-foreground">Perfect Pulls</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
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
