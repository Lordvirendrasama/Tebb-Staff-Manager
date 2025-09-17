
'use client';

import { useState, useEffect } from 'react';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, type Employee, type User, type LeaveRequest } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmployeeOfTheWeekManager } from '@/components/employee-of-the-week-manager';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, Database } from 'lucide-react';
import { OvertimeTracker } from '@/components/overtime-tracker';
import { StaffManager } from '@/components/staff-manager';
import { LeaveRequestManager } from '@/components/leave-request-manager';
import { MonthlyLeavesTracker } from '@/components/monthly-leaves-tracker';
import { SeedDatabaseButton } from '@/components/seed-database-button';
import { getAllUsersAllowances, getMonthlyOvertime, getEmployees, getAllLeaveRequests, getMonthlyLeaves } from '@/services/client/attendance-service';
import { getEmployeeOfTheWeekAction } from '@/services/awards-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDataButton } from '@/components/export-data-button';

export default function AdminPage() {
  const [allowanceData, setAllowanceData] = useState<any[]>([]);
  const [employeeOfTheWeek, setEmployeeOfTheWeek] = useState<User | null>(null);
  const [overtimeData, setOvertimeData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [monthlyLeaves, setMonthlyLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          allowance,
          eow,
          overtime,
          emps,
          leaves,
          monthlyL,
        ] = await Promise.all([
          getAllUsersAllowances(),
          getEmployeeOfTheWeekAction(),
          getMonthlyOvertime(),
          getEmployees(),
          getAllLeaveRequests(),
          getMonthlyLeaves(),
        ]);
        setAllowanceData(allowance);
        setEmployeeOfTheWeek(eow);
        setOvertimeData(overtime);
        setEmployees(emps);
        setLeaveRequests(leaves);
        setMonthlyLeaves(monthlyL);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
                  <CardDescription>Application data is now stored in Firebase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Firebase Firestore Enabled</AlertTitle>
                    <AlertDescription>
                      All application data is now stored in a secure, cloud-based Firestore database. You can manage your data directly in the Firebase console.
                    </AlertDescription>
                  </Alert>
                   <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Database/> Seed Database</CardTitle>
                        <CardDescription>Populate the database with default employee data if it's empty.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SeedDatabaseButton />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">Export Data</CardTitle>
                        <CardDescription>Download all application data as CSV files.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ExportDataButton />
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
