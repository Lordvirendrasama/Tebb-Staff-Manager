'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogItemForm } from '@/components/log-item-form';
import { ConsumptionHistory } from '@/components/consumption-history';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, GlassWater, Utensils } from 'lucide-react';
import {
  getRemainingAllowances,
  getLogsForUser,
} from '@/services/server/consumption-log-service';
import type { User, ConsumptionLog } from '@/lib/constants';

export default function UserDashboard() {
  const params = useParams();
  const user = params.user as User;

  const [allowances, setAllowances] = useState({ drinks: 0, meals: 0 });
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [allowanceData, logsData] = await Promise.all([
        getRemainingAllowances(user),
        getLogsForUser(user),
      ]);
      setAllowances(allowanceData);
      setLogs(logsData);
    }
    fetchData();
  }, [user]);

  const recentLogs = logs.slice(0, 5);
  const hasAllowance = allowances.drinks > 0 || allowances.meals > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user}!</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Allowance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasAllowance ? (
                <>
                  <div className="flex items-center gap-4">
                    <GlassWater className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{allowances.drinks}</p>
                      <p className="text-sm text-muted-foreground">drinks left</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Utensils className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{allowances.meals}</p>
                      <p className="text-sm text-muted-foreground">meals left</p>
                    </div>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <Ban className="h-4 w-4" />
                  <AlertTitle>No free items left!</AlertTitle>
                  <AlertDescription>
                    Please pay for any extra orders.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Log an Item</CardTitle>
              <CardDescription>Select an item you've consumed.</CardDescription>
            </CardHeader>
            <CardContent>
              <LogItemForm user={user} allowances={allowances} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Consumption History</CardTitle>
              <CardDescription>Your last 5 logged items this month.</CardDescription>
            </CardHeader>
            <CardContent>
              <ConsumptionHistory logs={recentLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
