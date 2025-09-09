'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import { getAllDataAction } from '@/app/actions/data-actions';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

export function ExportDataButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleExport = () => {
    startTransition(async () => {
      const result = await getAllDataAction();
      if (result.success && result.data) {
        try {
          const zip = new JSZip();

          // Consumption Logs
          if (result.data.consumptionLogs.length > 0) {
            const consumptionHeaders = ['employeeName', 'itemName', 'dateTimeLogged'];
            const consumptionCSV = convertToCSV(result.data.consumptionLogs, consumptionHeaders);
            zip.file('consumption_logs.csv', consumptionCSV);
          }

          // Attendance Logs
          if (result.data.attendanceLogs.length > 0) {
            const attendanceHeaders = ['employeeName', 'clockIn', 'clockOut'];
            const attendanceCSV = convertToCSV(result.data.attendanceLogs, attendanceHeaders);
            zip.file('attendance_logs.csv', attendanceCSV);
          }
          
          // Leave Requests
          if (result.data.leaveRequests.length > 0) {
            const leaveHeaders = ['employeeName', 'leaveDate', 'reason', 'status'];
            const leaveCSV = convertToCSV(result.data.leaveRequests, leaveHeaders);
            zip.file('leave_requests.csv', leaveCSV);
          }

          // Employee of the week
          const employeeOfTheWeekData = [{ employee: result.data.employeeOfTheWeek }];
          const employeeOfTheWeekHeaders = ['employee'];
          const employeeOfTheWeekCSV = convertToCSV(employeeOfTheWeekData, employeeOfTheWeekHeaders);
          zip.file('employee_of_the_week.csv', employeeOfTheWeekCSV);


          const zipBlob = await zip.generateAsync({ type: 'blob' });
          saveAs(zipBlob, '8-bit-bistro-data.zip');

          toast({ title: 'Success!', description: 'Data exported successfully.' });
        } catch (error) {
          console.error("Export error:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to create zip file.' });
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
    <Button onClick={handleExport} disabled={isPending} className="w-full">
      {isPending ? <Loader2 className="animate-spin" /> : <Download />}
      Export All Data
    </Button>
  );
}
