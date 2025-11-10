
'use client';

import { useState, useEffect } from 'react';
import { MONTHLY_DRINK_ALLOWANCE, MONTHLY_MEAL_ALLOWANCE, type Employee, type User, type ConsumableItemDef } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmployeeOfTheWeekManager } from '@/components/employee-of-the-week-manager';
import { Trash2 } from 'lucide-react';
import { StaffManager } from '@/components/staff-manager';
import { getAllUsers } from '@/app/actions/admin-actions';
import { onEmployeeOfTheWeekSnapshot } from '@/services/client/awards-service';
import { onConsumptionLogsSnapshot, onConsumableItemsSnapshot } from '@/services/client/consumption-log-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDataButton } from '@/components/export-data-button';
import { ResetDataButton } from '@/components/reset-data-button';
import { AdminAuth } from '@/components/admin-auth';
import { ItemManager } from '@/components/item-manager';
import { ExportEspressoDataButton } from '@/components/export-espresso-data-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  const [allowanceData, setAllowanceData] = useState<any[]>([]);
  const [employeeOfTheWeek, setEmployeeOfTheWeek] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [consumableItems, setConsumableItems] = useState<ConsumableItemDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubEow: (() => void) | undefined;
    let unsubConsumption: (() => void) | undefined;
    let unsubItems: (() => void) | undefined;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      try {
        const emps = await getAllUsers();
        setEmployees(emps);
        
        unsubEow = onEmployeeOfTheWeekSnapshot(setEmployeeOfTheWeek, (err) => console.error(err));
        unsubConsumption = onConsumptionLogsSnapshot(setAllowanceData, (err) => console.error(err));
        unsubItems = onConsumableItemsSnapshot(setConsumableItems, (err) => console.error(err));

      } catch (error) {
        console.error("Failed to fetch initial admin data or subscribe:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndSubscribe();

    return () => {
      unsubEow?.();
      unsubConsumption?.();
      unsubItems?.();
    };
  }, []);
  
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
        
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">General</TabsTrigger>
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
                        </div>
                         <div className="lg:col-span-1 space-y-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Employee of the Week</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <EmployeeOfTheWeekManager currentEmployee={employeeOfTheWeek} employees={employees} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
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
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <ExportDataButton />
                                            <ExportEspressoDataButton />
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
                     </div>
                </TabsContent>
            </Tabs>
        </div>
    </AdminAuth>
  );
}
