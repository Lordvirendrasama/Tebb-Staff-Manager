import { getRemainingAllowance, getLogsForUser, USERS } from '@/services/consumption-log-service';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogItemForm } from '@/components/log-item-form';
import { ConsumptionHistory } from '@/components/consumption-history';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, Gift } from 'lucide-react';
import type { User } from '@/services/consumption-log-service';

export default async function UserDashboard({ params }: { params: { user: string } }) {
  const { user } = params;

  if (!USERS.includes(user as User)) {
    redirect('/');
  }

  const validUser = user as User;

  const [allowance, logs] = await Promise.all([
    getRemainingAllowance(validUser),
    getLogsForUser(validUser),
  ]);

  const recentLogs = logs.slice(0, 5);

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
            <CardContent>
              {allowance > 0 ? (
                <div className="flex items-center gap-4">
                  <Gift className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-4xl font-bold">{allowance}</p>
                    <p className="text-sm text-muted-foreground">free items left</p>
                  </div>
                </div>
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
              <LogItemForm user={validUser} allowance={allowance} />
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
