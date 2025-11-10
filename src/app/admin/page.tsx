
'use client';

import { useState, useEffect } from 'react';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, type Employee, type User, type LeaveRequest, type ConsumableItemDef, type Payroll, type AttendanceLog } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmployeeOfTheWeekManager } from '@/components/employee-of-the-week-manager';
import { Trash2, User as UserIcon } from 'lucide-react';
import { WorkPerformanceTracker } from '@/components/overtime-tracker';
import { StaffManager } from '@/components/staff-manager';
import { LeaveRequestManager } from '@/components/leave-request-manager';
import { MonthlyLeavesTracker } from '@/components/monthly-leaves-tracker';
import { getAllUsers } from '@/app/actions/admin-actions';
import { getMonthlyWorkPerformance, onLeaveRequestsSnapshot, getMonthlyLeaves, getAllAttendanceForMonth } from '@/services/client/attendance-service';
import { onEmployeeOfTheWeekSnapshot } from '@/services/client/awards-service';
import { onConsumptionLogsSnapshot, onConsumableItemsSnapshot } from '@/services/client/consumption-log-service';
import { onPayrollSnapshot } from '@/services/client/payroll-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDataButton } from '@/components/export-data-button';
import { ResetDataButton } from '@/components/reset-data-button';
import { AdminAuth } from '@/components/admin-auth';
import { ItemManager } from '@/components/item-manager';
import { ExportEspressoDataButton } from '@/components/export-espresso-data-button';
import { PayrollManager } from '@/components/payroll-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceEditor } from '@/components/attendance-editor';
import { AttendanceViewer } from '@/components/attendance-viewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth } from 'date-fns';

export default function AdminPage() {
  const [allowanceData, setAllowanceData] = useState<any[]>([]);
  const [employeeOfTheWeek, setEmployeeOfTheWeek] = useState<User | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [monthlyLeaves, setMonthlyLeaves] = useState<any[]>([]);
  const [consumableItems, setConsumableItems] = useState<ConsumableItemDef[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedViewerEmployeeId, setSelectedViewerEmployeeId] = useState<string>('');
  const [viewerMonth, setViewerMonth] = useState<Date>(startOfMonth(new Date()));
  const [viewerLogs, setViewerLogs] = useState<AttendanceLog[]>([]);
  const [viewerLoading, setViewerLoading] = useState(false);
  
  const selectedViewerEmployee = employees.find(e => e.id === selectedViewerEmployeeId);

  const refreshGeneralData = async () => {
    if (employees.length > 0) {
        const [performance, monthlyL] = await Promise.all([
            getMonthlyWorkPerformance(),
            getMonthlyLeaves(),
        ]);
        setPerformanceData(performance);
        setMonthlyLeaves(monthlyL);
    }
  };

  const refreshViewerData = async () => {
    if (selectedViewerEmployee) {
      setViewerLoading(true);
      try {
        const logs = await getAllAttendanceForMonth(selectedViewerEmployee.name, viewerMonth);
        setViewerLogs(logs);
      } catch (error) {
        console.error("Failed to fetch viewer data", error);
      } finally {
        setViewerLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshViewerData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedViewerEmployeeId, viewerMonth]);

  useEffect(() => {
    let unsubLeaves: (() => void) | undefined;
    let unsubEow: (() => void) | undefined;
    let unsubConsumption: (() => void) | undefined;
    let unsubItems: (() => void) | undefined;
    let unsubPayrolls: (() => void) | undefined;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      try {
        const emps = await getAllUsers();
        setEmployees(emps);
        if (emps.length > 0 && !selectedViewerEmployeeId) {
            setSelectedViewerEmployeeId(emps[0].id);
        }
        
        await refreshGeneralData();
        
        unsubLeaves = onLeaveRequestsSnapshot(setLeaveRequests, (err) => console.error(err));
        unsubEow = onEmployeeOfTheWeekSnapshot(setEmployeeOfTheWeek, (err) => console.error(err));
        unsubConsumption = onConsumptionLogsSnapshot(setAllowanceData, (err) => console.error(err));
        unsubItems = onConsumableItemsSnapshot(setConsumableItems, (err) => console.error(err));
        unsubPayrolls = onPayrollSnapshot(setPayrolls, (err) => console.error(err));

      } catch (error) {
        console.error("Failed to fetch initial admin data or subscribe:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndSubscribe();

    return () => {
      unsubLeaves?.();
      unsubEow?.();
      unsubConsumption?.();
      unsubItems?.();
      unsubPayrolls?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEditorUpdate = () => {
    refreshGeneralData();
    refreshViewerData();
  };

  if (loading && employees.length === 0) {
    return (
        <AdminAuth>
            <div className="space-y-8">
                <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        </AdminAuth>
    );
  }

  return (
    <AdminAuth>
        <div className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        
            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="mt-6">
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
                                </CardHeader>
                                <CardContent>
                                    <EmployeeOfTheWeekManager currentEmployee={employeeOfTheWeek} employees={employees} />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <LeaveRequestManager requests={leaveRequests} />
                            <MonthlyLeavesTracker data={monthlyLeaves} />
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <WorkPerformanceTracker data={performanceData} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="attendance" className="mt-6">
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <AttendanceEditor employees={employees} onUpdate={onEditorUpdate} />
                        <div className="space-y-6">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Attendance Viewer</CardTitle>
                                    <CardDescription>Select an employee to view their attendance calendar.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <Select onValueChange={setSelectedViewerEmployeeId} value={selectedViewerEmployeeId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Employee to View" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                           
                           {selectedViewerEmployee ? (
                                <AttendanceViewer 
                                    employee={selectedViewerEmployee}
                                    month={viewerMonth}
                                    onMonthChange={setViewerMonth}
                                    attendanceLogs={viewerLogs}
                                    loading={viewerLoading}
                                />
                           ) : (
                                <Card>
                                    <CardContent className="h-96 flex items-center justify-center">
                                        <div className="text-center text-muted-foreground">
                                            <UserIcon className="mx-auto h-12 w-12" />
                                            <p>Please select an employee to view their attendance.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                           )}
                        </div>
                   </div>
                </TabsContent>
                
                <TabsContent value="payroll" className="mt-6">
                    <PayrollManager payrolls={payrolls} employees={employees} />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                     <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <div className="lg:col-span-1 space-y-8">
                            <StaffManager employees={employees} />
                        </div>
                         <div className="lg:col-span-1 space-y-8">
                            <ItemManager items={consumableItems} />
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Data Management</CardTitle>
                                    <CardDescription>Manage and export application data.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Export Data</CardTitle>
                                            <CardDescription>Download application data.</CardDescription>
                                        </Header>
                                        <CardContent className="space-y-2">
                                            <ExportDataButton />
                                            <ExportEspressoDataButton />
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2"><Trash2 className="text-destructive"/> Reset Application Data</CardTitle>
                                            <CardDescription>Permanently delete all data from the application.</CardDescription>
                                        </Header>
                                        <CardContent>
                                            <ResetDataButton />
                                        </CardContent>
                                    </Card>
                                </CardContent>
                            </Card>
                        </div>
                     </div>
                </TabsContent>
            </Tabs>
        </div>
    </AdminAuth>
  );
}
