
'use client';

import { useState, useEffect } from 'react';
import { redirect, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogItemForm } from '@/components/log-item-form';
import { ConsumptionHistory } from '@/components/consumption-history';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, GlassWater, Utensils, Loader2 } from 'lucide-react';
import type { User, ConsumptionLog, AttendanceStatus, AttendanceLog, LeaveRequest, Employee } from '@/lib/constants';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { getRemainingAllowances, getLogsForUser } from '@/services/client/consumption-log-service';
import { getAttendanceStatus, getAttendanceHistory, getLeaveRequestsForUser, getEmployees } from '@/services/client/attendance-service';
import { LeaveTracker } from '@/components/leave-tracker';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDashboard() {
  const params = useParams();
  const user = params.user as string;
  const validUser = user as User;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowances, setAllowances] = useState<{ drinks: number, meals: number } | null>(null);
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceLog[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidUser, setIsValidUser] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      setLoading(true);
      const fetchedEmployees = await getEmployees();
      setEmployees(fetchedEmployees);
      const employeeNames = fetchedEmployees.map(e => e.name);

      if (!employeeNames.includes(user as User)) {
        setIsValidUser(false);
        return;
      }
      setIsValidUser(true);

      try {
        const [
          allowanceData,
          logData,
          attendanceStatusData,
          attendanceHistoryData,
          leaveHistoryData
        ] = await Promise.all([
          getRemainingAllowances(validUser),
          getLogsForUser(validUser),
          getAttendanceStatus(validUser),
          getAttendanceHistory(validUser),
          getLeaveRequestsForUser(validUser),
        ]);

        setAllowances(allowanceData);
        setLogs(logData);
        setAttendanceStatus(attendanceStatusData);
        setAttendanceHistory(attendanceHistoryData);
        setLeaveHistory(leaveHistoryData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetchData();
  }, [user, validUser]);

  if (isValidUser === false) {
    redirect('/');
  }

  if (loading || isValidUser === null || !allowances || !attendanceStatus) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="md:col-span-1 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="md:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const recentLogs = logs.slice(0, 6);
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
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Clock in and out for your shift.</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTracker 
                user={validUser} 
                status={attendanceStatus} 
                history={attendanceHistory}
                setStatus={setAttendanceStatus}
                setHistory={setAttendanceHistory}
              />
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
                    <CardTitle>Consumption History</CardTitle>
                    <CardDescription>Your last 6 logged items this month.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ConsumptionHistory logs={recentLogs} />
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-1">
           <LeaveTracker user={validUser} history={leaveHistory} />
        </div>
      </div>
    </div>
  );
}
