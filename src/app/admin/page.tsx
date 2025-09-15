
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, ANNUAL_LEAVE_ALLOWANCE } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmployeeOfTheWeekManager } from '@/components/employee-of-the-week-manager';
import { getEmployeeOfTheWeek } from '@/services/awards-service';
import { getAllUsersAllowances } from '@/services/consumption-log-service';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { ExportDataButton } from '@/components/export-data-button';
import { ImportDataButton } from '@/components/import-data-button';
import { ExportCsvButton } from '@/components/export-csv-button';
import { LeaveRequestManager } from '@/components/leave-request-manager';
import { getAllLeaveRequests, getLeaveBalances, getMonthlyOvertime } from '@/services/attendance-service';
import { OvertimeTracker } from '@/components/overtime-tracker';

export default async function AdminPage() {
  const allowanceData = await getAllUsersAllowances();
  const employeeOfTheWeek = await getEmployeeOfTheWeek();
  const leaveRequests = await getAllLeaveRequests();
  const leaveBalances = await getLeaveBalances();
  const overtimeData = await getMonthlyOvertime();


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
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
           <Card>
              <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Import and export all application data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Local Data Storage</AlertTitle>
                    <AlertDescription>
                      All application data is stored in a local `db.json` file. You can export this file to create a backup or import a file to restore data.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-1 gap-4">
                    <ImportDataButton />
                    <ExportDataButton />
                    <ExportCsvButton />
                  </div>
              </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <LeaveRequestManager requests={leaveRequests} />
            <Card>
              <CardHeader>
                <CardTitle>Leave Balances</CardTitle>
                <CardDescription>Remaining paid leave days for the year.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {leaveBalances.map(({ user, remainingDays }) => (
                  <div key={user} className="space-y-3">
                    <p className="font-medium">{user}</p>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Paid Leave</span>
                        <span className="text-sm text-muted-foreground">
                            <span className="font-bold text-foreground">{remainingDays}</span> / {ANNUAL_LEAVE_ALLOWANCE} days left
                        </span>
                      </div>
                      <Progress value={(remainingDays / ANNUAL_LEAVE_ALLOWANCE) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
        </div>

         <div className="lg:col-span-1 space-y-8">
            <OvertimeTracker data={overtimeData} />
        </div>
      </div>
    </div>
  );
}
