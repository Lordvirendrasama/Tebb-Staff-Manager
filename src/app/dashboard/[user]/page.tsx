'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogItemForm } from '@/components/log-item-form';
import { ConsumptionHistory } from '@/components/consumption-history';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, GlassWater, Utensils, Loader2 } from 'lucide-react';
import { getRemainingAllowances } from '@/services/client/consumption-log-service';
import { onUserConsumptionLogsSnapshot } from '@/services/client/consumption-log-service';
import { getAttendanceStatus, getAttendanceHistory, getLeaveRequestsForUser, onUserPayrollSnapshot } from '@/services/client/attendance-service';
import type { User, ConsumptionLog, AttendanceStatus, AttendanceLog, LeaveRequest, Payroll } from '@/lib/constants';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { LeaveTracker } from '@/components/leave-tracker';
import { PayrollViewer } from '@/components/payroll-viewer';

export default function UserDashboard() {
  const params = useParams();
  const user = params.user as User;

  const [loading, setLoading] = useState(true);
  const [allowances, setAllowances] = useState<{ drinks: number, meals: number } | null>(null);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceLog[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  useEffect(() => {
    if (!user) return;
    
    let unsubConsumption: () => void;
    let unsubPayroll: () => void;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [allowanceData, statusData, attHistoryData, leaveData] = await Promise.all([
          getRemainingAllowances(user),
          getAttendanceStatus(user),
          getAttendanceHistory(user),
          getLeaveRequestsForUser(user),
        ]);
        setAllowances(allowanceData);
        setAttendanceStatus(statusData);
        setAttendanceHistory(attHistoryData);
        setLeaveHistory(leaveData);

        unsubConsumption = onUserConsumptionLogsSnapshot(user, setConsumptionLogs, console.error);
        unsubPayroll = onUserPayrollSnapshot(user, setPayrolls, console.error);

      } catch (error) {
        console.error("Failed to fetch initial dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    return () => {
      unsubConsumption?.();
      unsubPayroll?.();
    }
  }, [user]);

  const recentLogs = consumptionLogs.slice(0, 5);
  const hasAllowance = allowances ? allowances.drinks > 0 || allowances.meals > 0 : false;

  if (loading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

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
              {allowances === null ? <Loader2 className="animate-spin" /> : hasAllowance ? (
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
              {allowances !== null ? (
                <LogItemForm user={user} allowances={allowances} />
              ) : <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
            {attendanceStatus && <AttendanceTracker user={user} status={attendanceStatus} history={attendanceHistory} setStatus={setAttendanceStatus} setHistory={setAttendanceHistory} />}
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
        <div className="lg:col-span-1 space-y-8">
            <LeaveTracker user={user} history={leaveHistory} />
        </div>
      </div>
    </div>
  );
}
