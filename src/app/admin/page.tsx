
import { getRemainingAllowances } from '@/services/consumption-log-service';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, USERS } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AdminDashboard } from '@/components/admin-dashboard';
import type { User } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

export default async function AdminPage() {
  const allowanceData = await Promise.all(
    USERS.map(async (user) => ({
      user,
      allowances: await getRemainingAllowances(user as User),
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
            {allowanceData.map(({ user, allowances }) => (
              <div key={user} className="space-y-3">
                <p className="font-medium">{user}</p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Drinks</span>
                      <span className="text-sm text-muted-foreground">
                          <span className="font-bold text-foreground">{allowances.drinks}</span> / {MONTHLY_DRINK_ALLOWANCE} left
                      </span>
                  </div>
                  <Progress value={(allowances.drinks / MONTHLY_DRINK_ALLOWANCE) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Meals</span>
                      <span className="text-sm text-muted-foreground">
                          <span className="font-bold text-foreground">{allowances.meals}</span> / {MONTHLY_MEAL_ALLOWANCE} left
                      </span>
                  </div>
                  <Progress value={(allowances.meals / MONTHLY_MEAL_ALLOWANCE) * 100} className="h-2" />
                </div>
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
