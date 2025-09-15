
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ConsumptionLog } from '@/lib/constants';
import { Coffee, GlassWater, Milk, Soup, UtensilsCrossed } from 'lucide-react';
import type { FC, SVGProps } from 'react';
import { useState, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';

const FriesIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 14.5v-1.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25V14.5" />
      <path d="M11.5 14.5v-4.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25V14.5" />
      <path d="M6 10h12" />
      <path d="M16.5 14.5v-2.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25V14.5" />
      <path d="M5.25 10.25a.25.25 0 0 1-.25-.25V8.2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.8a.25.25 0 0 1-.25.25" />
      <path d="M5 14.5h14a1 1 0 0 1 1 1v1.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V15.5a1 1 0 0 1 1-1z" />
    </svg>
);

const itemIcons: { [key: string]: FC<SVGProps<SVGSVGElement>> } = {
  Coffee: Coffee,
  Cooler: GlassWater,
  Milkshake: Milk,
  Maggie: Soup,
  Pasta: UtensilsCrossed,
  Fries: FriesIcon,
};

export function ConsumptionHistory({ logs }: { logs: ConsumptionLog[] }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatLocaleDate = (date: Date) => {
    return new Date(date).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
  };

  const formatLocaleTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
  };

  if (logs.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No items logged yet.</p>;
  }

  return (
    <ScrollArea className="h-72">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log, index) => {
              const Icon = itemIcons[log.itemName] || UtensilsCrossed;
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span>{log.itemName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{isClient ? formatLocaleDate(log.dateTimeLogged) : '...'}</TableCell>
                  <TableCell className="text-right">{isClient ? formatLocaleTime(log.dateTimeLogged) : '...'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
