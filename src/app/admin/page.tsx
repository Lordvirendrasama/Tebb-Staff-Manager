
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmployeeOfTheWeekManager } from '@/components/employee-of-the-week-manager';
import { getEmployeeOfTheWeek } from '@/services/awards-service';
import { getAllUsersAllowances } from '@/services/consumption-log-service';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { ExportDataButton } from '@/components/export-data-button';


export default async function AdminPage() {
  const allowanceData = await getAllUsersAllowances();
  const employeeOfTheWeek = await getEmployeeOfTheWeek();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div className="md:col-span-1 space-y-8">
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
              <CardTitle>Employee of the Week</CardTitle>
              <CardDescription>Set the employee of the week.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeOfTheWeekManager currentEmployee={employeeOfTheWeek} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>All data is stored locally in the project.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Local Data Storage</AlertTitle>
                    <AlertDescription>
                      All application data is stored in a local `db.json` file within the project, making it persistent and portable for local development.
                    </AlertDescription>
                  </Alert>
                  <ExportDataButton />
              </CardContent>
            </Everything>
        </div>
      </div>
    </div>
  );
}
