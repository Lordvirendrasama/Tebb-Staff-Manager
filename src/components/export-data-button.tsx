
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import { getAllDataAction } from '@/app/actions/data-actions';
import { saveAs } from 'file-saver';

export function ExportDataButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleExport = () => {
    startTransition(async () => {
      const result = await getAllDataAction();
      if (result.success && result.data) {
        try {
          const dataToExport = {
            consumptionLogs: result.data.consumptionLogs.map(log => ({...log, dateTimeLogged: new Date(log.dateTimeLogged).toISOString()})),
            attendanceLogs: result.data.attendanceLogs.map(log => ({...log, clockIn: new Date(log.clockIn).toISOString(), clockOut: log.clockOut ? new Date(log.clockOut).toISOString() : undefined })),
            leaveRequests: result.data.leaveRequests.map(req => ({...req, startDate: new Date(req.startDate).toISOString(), endDate: new Date(req.endDate).toISOString()})),
            employeeOfTheWeek: result.data.employeeOfTheWeek
          }

          const jsonBlob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
          saveAs(jsonBlob, 'database.json');

          toast({ title: 'Success!', description: 'Data exported successfully as database.json.' });
        } catch (error) {
          console.error("Export error:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to create JSON file.' });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || 'Failed to export data.',
        });
      }
    });
  };

  return (
    <Button onClick={handleExport} disabled={isPending} className="w-full" variant="outline">
      {isPending ? <Loader2 className="animate-spin" /> : <Download />}
      Export to JSON
    </Button>
  );
}
