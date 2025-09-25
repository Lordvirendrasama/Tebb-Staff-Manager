
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { EspressoLog as EspressoLogType } from '@/lib/constants';

type SortKey = keyof EspressoLogType;

export function EspressoLog({ logs }: { logs: EspressoLogType[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'pullDateTime', direction: 'descending'});

  const sortedLogs = useMemo(() => {
    let sortableLogs = [...logs];
    if (sortConfig !== null) {
      sortableLogs.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLogs;
  }, [logs, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (date: Date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Espresso Log</CardTitle>
        <CardDescription>A complete history of all espresso pulls.</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No espresso pulls logged yet.</p>
        ) : (
          <ScrollArea className="h-[32rem] w-full">
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('pullDateTime')}>
                            Date {getSortIndicator('pullDateTime')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('employeeName')}>
                            Employee {getSortIndicator('employeeName')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('coffeeType')}>
                            Drink {getSortIndicator('coffeeType')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => requestSort('timeTaken')}>
                            Time {getSortIndicator('timeTaken')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                        <Button variant="ghost" onClick={() => requestSort('coffeeUsed')}>
                            Grams {getSortIndicator('coffeeUsed')}
                        </Button>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedLogs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell>
                            <div className="font-medium">{formatDate(log.pullDateTime)}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(log.pullDateTime)}</div>
                        </TableCell>
                        <TableCell>{log.employeeName}</TableCell>
                        <TableCell>{log.coffeeType}</TableCell>
                        <TableCell className="text-right">{log.timeTaken}s</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{log.coffeeUsed.toFixed(2)}g</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
