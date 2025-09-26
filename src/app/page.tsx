import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog } from 'lucide-react';
import { getEmployees } from '@/services/get-employees';
import type { Employee } from '@/lib/constants';

function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <Link href={`/dashboard/${employee.name}`} className="block">
      <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="text-center items-center p-10">
          <Users className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-semibold">{employee.name}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default async function Home() {
  const employees = await getEmployees();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-foreground">Staff Manager</h1>
        <p className="text-muted-foreground mt-2">A simple way to track staff meals.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {employees.map(employee => (
          <EmployeeCard key={employee.name} employee={employee} />
        ))}
        <Link href="/admin" className="block">
          <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="text-center items-center p-10">
              <UserCog className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-2xl font-semibold">Admin</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}
