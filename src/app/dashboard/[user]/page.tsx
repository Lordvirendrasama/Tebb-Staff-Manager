'use client';

import { useState, useEffect } from 'react';
import { redirect, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LogItemForm } from '@/components/log-item-form';
import { ConsumptionHistory } from '@/components/consumption-history';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, GlassWater, Utensils } from 'lucide-react';
import type { User, ConsumptionLog, AttendanceStatus, AttendanceLog, LeaveRequest, ConsumableItemDef } from '@/lib/constants';
import { AttendanceTracker } from '@/components/attendance-tracker';
import { onUserConsumptionLogsSnapshot, getConsumableItems } from '@/services/client/consumption-log-service';
import { getAttendanceStatus, getAttendanceHistory, getLeaveRequestsForUser, getEmployees } from '@/services/client/attendance-service';
import { LeaveTracker } from '@/components/leave-tracker';
import { Skeleton } from '@/components/ui/skeleton';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE } from '@/lib/constants';

export default function UserDashboard() {
  const params = useParams();
  const user = params.user as User;

  const [loading, setLoading] = useState(true);
  const [isValidUser, setIsValidUser] = useState<boolean | null>(null);
  
  const [allowances, setAllowances] = useState<{ drinks: number, meals: number } | null>(null);
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [consumableItems, setConsumableItems] = useState<ConsumableItemDef[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceLog[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    let unsubscribeLogs: (() => void) | undefined;

    const initializeDashboard = async () => {
      setLoading(true);

      // 1. Validate User
      const allEmployees = await getEmployees();
      const userExists = allEmployees.some(employee => employee.name === user);

      if (!userExists) {
        setIsValidUser(false);
        setLoading(false);
        return;
      }
      setIsValidUser(true);

      // 2. Fetch all initial data in parallel
      try {
        const [
          statusData,
          historyData,
          leaveData,
          itemsData,
        ] = await Promise.all([
          getAttendanceStatus(user),
          getAttendanceHistory(user),
          getLeaveRequestsForUser(user),
          getConsumableItems(),
        ]);

        setAttendanceStatus(statusData);
        setAttendanceHistory(historyData);
        setLeaveHistory(leaveData);
        setConsumableItems(itemsData);

        // 3. Set up Firestore listener for real-time consumption logs
        unsubscribeLogs = onUserConsumptionLogsSnapshot(
          user,
          (updatedLogs) => {
            setLogs(updatedLogs);
            const drinkItems = itemsData.filter(i => i.type === 'Drink').map(i => i.name);
            const mealItems = itemsData.filter(i => i.type === 'Meal').map(i => i.name);
            const drinksConsumed = updatedLogs.filter(log => drinkItems.includes(log.itemName)).length;
            const mealsConsumed = updatedLogs.filter(log => mealItems.includes(log.itemName)).length;
            setAllowances({
              drinks: MONTHLY_DRINK_ALLOWANCE - drinksConsumed,
              meals: MONTHLY_MEAL_ALLOWANCE - mealsConsumed,
            });
          },
          (error) => {
            console.error("Failed to listen to consumption logs:", error);
          }
        );

      } catch (error) {
        console.error("Failed to fetch initial dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Cleanup listener on component unmount
    return () => {
      unsubscribeLogs?.();
    };
  }, [user]);

  if (isValidUser === false) {
    redirect('/');
  }

  if (loading || !allowances || !attendanceStatus) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[40rem] w-full" />
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {user}!</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Clock in and out for your shift.</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTracker 
                user={user} 
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
        
        <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                  <CardTitle>Log an Item</CardTitle>
                  <CardDescription>Select an item you've consumed.</CardDescription>
              </CardHeader>
              <CardContent>
                  <LogItemForm user={user} allowances={allowances} items={consumableItems} />
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Consumption History</CardTitle>
                    <CardDescription>Your last 6 logged items this month.</CardDescription>
                </Header>
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
