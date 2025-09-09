
import { USERS } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogItemForm } from '@/components/log-item-form';
import { ConsumptionHistory } from '@/components/consumption-history';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, GlassWater, Utensils } from 'lucide-react';
import type { User } from '@/lib/constants';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { LeaveTracker } from '@/components/leave-tracker';
import { getRemainingAllowances, getLogsForUser } from '@/services/consumption-log-service';
import { getAttendanceStatus, getAttendanceHistory, getLeaveRequestsForUser } from '@/services/attendance-service';

export default async function UserDashboard({ params }: { params: { user: string } }) {
  const { user } = params;

  if (!USERS.includes(user as User)) {
    redirect('/');
  }

  const validUser = user as User;

  const allowances = await getRemainingAllowances(validUser);
  const logs = await getLogsForUser(validUser);
  const attendanceStatus = await getAttendanceStatus(validUser);
  const attendanceHistory = await getAttendanceHistory(validUser);
  const leaveRequests = await getLeaveRequestsForUser(validUser);

  const recentLogs = logs.slice(0, 5);
  const hasAllowance = allowances.drinks > 0 || allowances.meals > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user}!</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Column 1 */}
        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Clock in and out for your shift.</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTracker user={validUser} status={attendanceStatus} history={attendanceHistory} />
            </CardContent>
          </Card>
          
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
        
        {/* Column 2 */}
        <div className="md:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Log an Item</CardTitle>
                    <CardDescription>Select an item you've consumed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LogItemForm user={validUser} allowances={allowances} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Leave Tracker</CardTitle>
                    <CardDescription>Request time off and see your history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LeaveTracker user={validUser} leaveRequests={leaveRequests} />
                </CardContent>
            </Card>
        </div>

        {/* Column 3 */}
        <div className="md:col-span-1">
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
