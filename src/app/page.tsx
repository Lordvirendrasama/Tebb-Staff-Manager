
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, Coffee, Utensils, LogIn, CalendarDays, FileText, Calculator, Award } from 'lucide-react';
import { getAllUsers, getEmployeeOfTheWeek } from '@/app/actions/admin-actions';
import type { Employee } from '@/lib/constants';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';

async function EmployeeCard({ employee, isEmployeeOfTheWeek }: { employee: Employee, isEmployeeOfTheWeek: boolean }) {
  return (
    <Link href={`/dashboard/${employee.name}`} className="block h-full">
      <Card className="hover:bg-primary/10 hover:border-primary transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-center">
        <CardHeader className="text-center items-center justify-center p-6">
          <Users className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-semibold font-headline">{employee.name}</CardTitle>
          {isEmployeeOfTheWeek && (
            <Badge variant="secondary" className="mt-2 border-accent text-accent-foreground border-2 dark:bg-white dark:text-black">
              <Award className="h-4 w-4 mr-1" />
              Employee of the Week
            </Badge>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

function AdminCard() {
    return (
        <Link href="/admin" className="block h-full">
          <Card className="hover:bg-primary/10 hover:border-primary transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-center">
            <CardHeader className="text-center items-center justify-center p-6">
              <UserCog className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-2xl font-semibold font-headline">Admin Panel</CardTitle>
            </CardHeader>
          </Card>
        </Link>
    );
}

function EspressoCard() {
    return (
         <Link href="/espresso-tracker" className="block h-full">
            <Card className="hover:bg-primary/10 hover:border-primary transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-center">
                <CardHeader className="text-center items-center justify-center p-6">
                    <Coffee className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-2xl font-semibold font-headline">Espresso Tracker</CardTitle>
                </CardHeader>
            </Card>
        </Link>
    )
}

function PayrollCalculatorCard() {
    return (
        <Link href="/payroll-calculator" className="block h-full">
            <Card className="hover:bg-primary/10 hover:border-primary transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-center">
                <CardHeader className="text-center items-center justify-center p-6">
                    <Calculator className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-2xl font-semibold font-headline">Payroll Calculator</CardTitle>
                </CardHeader>
            </Card>
        </Link>
    );
}


function FeatureCard({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href?: string }) {
  const cardContent = (
    <Card className="bg-card/50 border-border/50 h-full">
      <CardHeader className="flex flex-row items-center gap-4">
        {icon}
        <div>
          <CardTitle className="text-lg font-semibold font-headline">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
    </Card>
  );
  
  if (href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }
  
  return cardContent;
}

export default async function Home() {
  const [employees, employeeOfTheWeek] = await Promise.all([
    getAllUsers(),
    getEmployeeOfTheWeek()
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-headline">The 8 Bit Bistro</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg">Your all-in-one solution for managing cafe staff efficiently.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <h3 className="col-span-full text-2xl font-semibold tracking-tight text-center sm:text-left font-headline">Who are you?</h3>
            {employees.map(employee => (
              <EmployeeCard key={employee.id} employee={employee} isEmployeeOfTheWeek={employee.name === employeeOfTheWeek} />
            ))}
            <AdminCard />
            <EspressoCard />
            <PayrollCalculatorCard />
        </div>

        <div className="space-y-8">
            <h3 className="text-2xl font-semibold tracking-tight text-center font-headline">Core Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={<Utensils className="w-8 h-8 text-primary" />}
                    title="Allowance Tracking"
                    description="Monitor monthly meal and drink allowances for each staff member."
                />
                 <FeatureCard 
                    icon={<LogIn className="w-8 h-8 text-primary" />}
                    title="Attendance Management"
                    description="Clock-in and clock-out system with overtime calculation."
                />
                 <FeatureCard 
                    icon={<CalendarDays className="w-8 h-8 text-primary" />}
                    title="Leave Requests"
                    description="Streamlined process for submitting and approving leave requests."
                />
                 <FeatureCard 
                    icon={<FileText className="w-8 h-8 text-primary" />}
                    title="Payroll Management"
                    description="Automated salary calculation based on attendance and deductions."
                />
                <FeatureCard
                    icon={<Coffee className="w-8 h-8 text-primary" />}
                    title="Espresso Consistency"
                    description="Log and track espresso shots to maintain quality standards."
                />
                <FeatureCard
                    icon={<Calculator className="w-8 h-8 text-primary" />}
                    title="Payroll Calculator"
                    description="A simple tool for calculating employee pay based on worked days."
                />
            </div>
        </div>
      </div>
    </main>
  );
}
