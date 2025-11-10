'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ConsumptionLog } from '@/lib/constants';
import { formatIST } from '@/lib/date-utils';

export function ConsumptionHistory({ logs }: { logs: ConsumptionLog[] }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length > 0 ? logs.map((log, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{log.itemName}</TableCell>
              <TableCell className="text-right">{formatIST(new Date(log.dateTimeLogged), 'p')}</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No items logged yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
