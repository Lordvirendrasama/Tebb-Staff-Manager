
import { getRemainingAllowances, getLogsForUser } from '@/services/consumption-log-service';
import { USERS } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogItemForm } from '@/components/log-item-form';
import { ConsumptionHistory } from '@/components/consumption-history';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, Gift, Utensils, GlassWater } from 'lucide-react';
import type { User } from '@/lib/constants';

export default async function UserDashboard({ params }: { params: { user: string } }) {
  const { user } = params;

  if (!USERS.includes(user as User)) {
    redirect('/');
  }

  const validUser = user as User;

  const [allowances, logs] = await Promise.all([
    getRemainingAllowances(validUser),
    getLogsForUser(validUser),
  ]);

  const recentLogs = logs.slice(0, 5);
  const hasAllowance = allowances.drinks > 0 || allowances.meals > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user}!</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
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
          
          <Card>
            <CardHeader>
              <CardTitle>Log an Item</CardTitle>
              <CardDescription>Select an item you've consumed.</CardDescription>
            </CardHeader>
            <CardContent>
              <LogItemForm user={validUser} allowances={allowances} />
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
            <Card className="h-full">
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
