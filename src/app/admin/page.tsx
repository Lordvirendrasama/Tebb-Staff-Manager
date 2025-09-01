import { getRemainingAllowance } from '@/services/consumption-log-service';
import { MONTHLY_ALLOWANCE, USERS } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AdminDashboard } from '@/components/admin-dashboard';
import type { User } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

export default async function AdminPage() {
  const allowanceData = await Promise.all(
    USERS.map(async (user) => ({
      user,
      allowance: await getRemainingAllowance(user as User),
    }))
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Allowances</CardTitle>
            <CardDescription>Remaining monthly allowance for each user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {allowanceData.map(({ user, allowance }) => (
              <div key={user}>
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{user}</span>
                    <span className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{allowance}</span> / {MONTHLY_ALLOWANCE} left
                    </span>
                </div>
                <Progress value={(allowance / MONTHLY_ALLOWANCE) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Generate a CSV report of all consumption logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
