import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCog } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold font-headline text-foreground">TrackEat</h1>
        <p className="text-muted-foreground mt-2 text-lg">A simple way to track staff meals.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link href="/dashboard/Abbas" className="block">
          <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="text-center items-center py-10">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold">Abbas</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/Musaib" className="block">
          <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="text-center items-center py-10">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold">Musaib</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin" className="block">
          <Card className="hover:bg-accent/50 hover:border-accent transition-all duration-300 transform hover:-translate-y-1">
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
