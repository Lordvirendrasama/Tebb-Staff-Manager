
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, Trophy, Coffee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAttendanceStatus, getEmployees } from '@/services/client/attendance-service';
import { getEmployeeOfTheWeekAction } from '@/services/client/awards-service';
import type { Employee, User, AttendanceStatus } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function EmployeeCard({ employee, status, employeeOfTheWeek }: { employee: Employee; status: AttendanceStatus | null, employeeOfTheWeek: User | null }) {
  return (
    <Link href={`/dashboard/${employee.name}`} className="block">
      <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1 h-full">
        <CardHeader className="text-center items-center p-6 sm:py-10">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            {employee.name}
          </CardTitle>
          {status?.status === 'Clocked In' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Clocked In
            </div>
          )}
          {employeeOfTheWeek === employee.name && (
            <Badge variant="secondary" className="mt-2 border-yellow-400 text-yellow-400">
              <Trophy className="mr-2 h-4 w-4" />
              Employee of the Week
            </Badge>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

function EmployeeCardSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader className="text-center items-center p-6 sm:py-10">
                <Skeleton className="h-20 w-20 rounded-full mb-4" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
            </CardHeader>
        </Card>
    )
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | null>>({});
  const [employeeOfTheWeek, setEmployeeOfTheWeek] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [fetchedEmployees, eowResult] = await Promise.all([
            getEmployees(),
            getEmployeeOfTheWeekAction()
        ]);
        
        setEmployees(fetchedEmployees);
        setEmployeeOfTheWeek(eowResult);

        if (fetchedEmployees.length > 0) {
            const statusPromises = fetchedEmployees.map(emp => getAttendanceStatus(emp.name));
            const statusesResults = await Promise.all(statusPromises);

            const newStatuses: Record<string, any> = {};
            fetchedEmployees.forEach((emp, index) => {
                newStatuses[emp.name] = statusesResults[index];
            });
            setStatuses(newStatuses);
        }
      } catch (error) {
          console.error("Failed to fetch initial data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold font-headline text-foreground leading-relaxed">The 8 Bit Bistro<br />Staff Manager</h1>
        <p className="text-muted-foreground mt-4 text-sm">A simple way to track staff meals.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {loading ? (
          <>
            <EmployeeCardSkeleton />
            <EmployeeCardSkeleton />
            <EmployeeCardSkeleton />
            <EmployeeCardSkeleton />
          </>
        ) : (
          <>
            {employees.map(employee => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                status={statuses[employee.name]}
                employeeOfTheWeek={employeeOfTheWeek}
              />
            ))}
             <Link href="#" className="block">
              <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1 h-full">
                <CardHeader className="text-center items-center p-6 sm:py-10">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Coffee className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold">Espresso Tracker</CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin" className="block">
              <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1 h-full">
                <CardHeader className="text-center items-center p-6 sm:py-10">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <UserCog className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold">Admin</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
