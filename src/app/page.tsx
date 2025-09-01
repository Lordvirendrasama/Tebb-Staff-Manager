
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, Trophy } from 'lucide-react';
import { getAttendanceStatus } from '@/services/attendance-service';
import { getEmployeeOfTheWeek } from '@/services/awards-service';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
  const [abbasStatus, musaibStatus, employeeOfTheWeek] = await Promise.all([
    getAttendanceStatus('Abbas'),
    getAttendanceStatus('Musaib'),
    getEmployeeOfTheWeek(),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground leading-relaxed">The 8 Bit Bistro<br/>Staff Manager</h1>
        <p className="text-muted-foreground mt-4 text-sm">A simple way to track staff meals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link href="/dashboard/Abbas" className="block">
          <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1 h-full">
            <CardHeader className="text-center items-center py-10">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                Abbas
              </CardTitle>
              {employeeOfTheWeek?.employeeName === 'Abbas' && (
                <Badge variant="secondary" className="mt-2 bg-yellow-400/10 text-yellow-300 border-yellow-400/20">
                  <Trophy className="h-4 w-4 mr-2" />
                  Employee of the Week
                </Badge>
              )}
              {abbasStatus.status === 'Clocked In' && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Clocked In
                </div>
              )}
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/Musaib" className="block">
          <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1 h-full">
            <CardHeader className="text-center items-center py-10">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                Musaib
              </CardTitle>
              {employeeOfTheWeek?.employeeName === 'Musaib' && (
                <Badge variant="secondary" className="mt-2 bg-yellow-400/10 text-yellow-300 border-yellow-400/20">
                  <Trophy className="h-4 w-4 mr-2" />
                  Employee of the Week
                </Badge>
              )}
              {musaibStatus.status === 'Clocked In' && (
                 <div className="flex items-center gap-2 mt-2 text-sm text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Clocked In
                </div>
              )}
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin" className="block">
          <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1 h-full">
            <CardHeader className="text-center items-center py-10">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <UserCog className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold">Admin</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}
