
import Link from 'next/link';
import { Calculator } from 'lucide-react';
import type { ReactNode } from 'react';

export default function PayrollCalculatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Calculator className="h-6 w-6 text-primary" />
            <span className="font-headline text-sm md:text-base">The 8 Bit Bistro</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
