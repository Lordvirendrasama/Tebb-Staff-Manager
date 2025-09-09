
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import { getAllDataAction } from '@/app/actions/data-actions';
import { saveAs } from 'file-saver';

export function ExportCsvButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const convertToCsv = (data: any[], headers: string[]) => {
    const headerRow = headers.join(',');
    const rows = data.map(row => 
        headers.map(header => JSON.stringify(row[header] ?? '', (key, value) => value ?? '')).join(',')
    );
    return [headerRow, ...rows].join('\n');
  };

  const handleExport = () => {
    startTransition(async () => {
      const result = await getAllDataAction();
      if (result.success && result.data) {
        try {
            // Consumption Logs
            if (result.data.consumptionLogs.length > 0) {
                const consumptionHeaders = ['employeeName', 'itemName', 'dateTimeLogged'];
                const consumptionCsv = convertToCsv(result.data.consumptionLogs, consumptionHeaders);
                const consumptionBlob = new Blob([consumptionCsv], { type: 'text/csv;charset=utf-8;' });
                saveAs(consumptionBlob, 'consumption_logs.csv');
            }
            
            // Attendance Logs
            if (result.data.attendanceLogs.length > 0) {
                const attendanceHeaders = ['employeeName', 'clockIn', 'clockOut'];
                const attendanceCsv = convertToCsv(result.data.attendanceLogs, attendanceHeaders);
                const attendanceBlob = new Blob([attendanceCsv], { type: 'text/csv;charset=utf-8;' });
                saveAs(attendanceBlob, 'attendance_logs.csv');
            }

            // Leave Requests
            if (result.data.leaveRequests.length > 0) {
                const leaveHeaders = ['employeeName', 'startDate', 'endDate', 'reason', 'leaveType', 'status'];
                const leaveCsv = convertToCsv(result.data.leaveRequests, leaveHeaders);
                const leaveBlob = new Blob([leaveCsv], { type: 'text/csv;charset=utf-8;' });
                saveAs(leaveBlob, 'leave_requests.csv');
            }
          
            toast({ title: 'Success!', description: 'Data exported to CSV files.' });

        } catch (error) {
          console.error("Export error:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to create CSV file.' });
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
      Export to CSV
    </Button>
  );
}
