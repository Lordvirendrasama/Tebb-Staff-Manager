import type { Metadata } from 'next';
import { Anton } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-anton',
});

const karmaticArcade = localFont({
  src: '../lib/fonts/karmatic-arcade.woff2',
  variable: '--font-karmatic-arcade',
});

export const metadata: Metadata = {
  title: 'The 8 Bit Bistro',
  description: 'An all-in-one solution for managing cafe staff efficiently.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", anton.variable, karmaticArcade.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
