
'use client';

import { useState, useEffect } from 'react';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, type Employee, type User, type LeaveRequest } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmployeeOfTheWeekManager } from '@/components/employee-of-the-week-manager';
import { Trash2 } from 'lucide-react';
import { OvertimeTracker } from '@/components/overtime-tracker';
import { StaffManager } from '@/components/staff-manager';
import { LeaveRequestManager } from '@/components/leave-request-manager';
import { MonthlyLeavesTracker } from '@/components/monthly-leaves-tracker';
import { getMonthlyOvertime, onEmployeesSnapshot, onLeaveRequestsSnapshot, getMonthlyLeaves } from '@/services/client/attendance-service';
import { onEmployeeOfTheWeekSnapshot } from '@/services/client/awards-service';
import { onConsumptionLogsSnapshot } from '@/services/client/consumption-log-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDataButton } from '@/components/export-data-button';
import { ResetDataButton } from '@/components/reset-data-button';

export default function AdminPage() {
  const [allowanceData, setAllowanceData] = useState<any[]>([]);
  const [employeeOfTheWeek, setEmployeeOfTheWeek] = useState<User | null>(null);
  const [overtimeData, setOvertimeData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [monthlyLeaves, setMonthlyLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubEmployees: () => void;
    let unsubLeaves: () => void;
    let unsubEow: () => void;
    let unsubConsumption: () => void;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      try {
        const [overtime, monthlyL] = await Promise.all([
          getMonthlyOvertime(),
          getMonthlyLeaves(),
        ]);

        setOvertimeData(overtime);
        setMonthlyLeaves(monthlyL);
        
        unsubEmployees = onEmployeesSnapshot(setEmployees, (err) => console.error(err));
        unsubLeaves = onLeaveRequestsSnapshot(setLeaveRequests, (err) => console.error(err));
        unsubEow = onEmployeeOfTheWeekSnapshot(setEmployeeOfTheWeek, (err) => console.error(err));
        unsubConsumption = onConsumptionLogsSnapshot(setAllowanceData, (err) => console.error(err));

      } catch (error) {
        console.error("Failed to fetch initial admin data or subscribe:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndSubscribe();

    return () => {
      unsubEmployees?.();
      unsubLeaves?.();
      unsubEow?.();
      unsubConsumption?.();
    };
  }, []);

  if (loading) {
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
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Employee of the Week</CardTitle>
                <CardDescription>Set the employee of the week.</CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
             <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-8">
             <Skeleton className="h-80 w-full" />
             <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      
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
              <EmployeeOfTheWeekManager currentEmployee={employeeOfTheWeek} employees={employees} />
            </CardContent>
          </Card>
          <LeaveRequestManager requests={leaveRequests} />
        </div>

        <div className="lg:col-span-1 space-y-8">
           <StaffManager employees={employees} />
             <Card>
              <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage and export application data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">Export Data</CardTitle>
                        <CardDescription>Download all application data as a single CSV file.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ExportDataButton />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Trash2 className="text-destructive"/> Reset Application Data</CardTitle>
                        <CardDescription>Permanently delete all data from the application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResetDataButton />
                    </CardContent>
                  </Card>
              </CardContent>
            </Card>
        </div>

         <div className="lg:col-span-1 space-y-8">
            <OvertimeTracker data={overtimeData} />
            <MonthlyLeavesTracker data={monthlyLeaves} />
        </div>
      </div>
    </div>
  );
}
