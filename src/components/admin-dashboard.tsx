
'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateConsumptionReport } from '@/ai/flows/generate-consumption-report';
import { generateAttendanceReport } from '@/ai/flows/generate-attendance-report';
import { generateLeaveReport } from '@/ai/flows/generate-leave-report';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Utensils, Clock, CalendarOff, Package } from 'lucide-react';
import JSZip from 'jszip';

type ReportType = 'consumption' | 'attendance' | 'leave' | 'all';

export function AdminDashboard() {
  const [isPending, startTransition] = useTransition();
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const { toast } = useToast();

  const handleExportAll = () => {
    startTransition(async () => {
      setActiveReport('all');
      try {
        const [consumptionData, attendanceData, leaveData] = await Promise.all([
          generateConsumptionReport({}),
          generateAttendanceReport({}),
          generateLeaveReport({}),
        ]);

        const zip = new JSZip();
        const date = new Date().toISOString().split('T')[0];
        zip.file(`consumption-report-${date}.csv`, consumptionData);
        zip.file(`attendance-report-${date}.csv`, attendanceData);
        zip.file(`leave-report-${date}.csv`, leaveData);

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(content);
        link.setAttribute('href', url);
        link.setAttribute('download', `all-reports-${date}.zip`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export Successful',
          description: 'All reports are downloading in a zip file.',
        });
      } catch (error) {
        console.error('Export failed:', error);
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: 'Could not generate or download the reports.',
        });
      } finally {
        setActiveReport(null);
      }
    });
  }

  const handleExport = (reportType: ReportType) => {
    if (reportType === 'all') {
      handleExportAll();
      return;
    }
    startTransition(async () => {
      setActiveReport(reportType);
      try {
        let csvData: string;
        let fileName: string;
        const date = new Date().toISOString().split('T')[0];

        switch (reportType) {
          case 'consumption':
            csvData = await generateConsumptionReport({});
            fileName = `consumption-report-${date}.csv`;
            break;
          case 'attendance':
            csvData = await generateAttendanceReport({});
            fileName = `attendance-report-${date}.csv`;
            break;
          case 'leave':
            csvData = await generateLeaveReport({});
            fileName = `leave-report-${date}.csv`;
            break;
          default:
            throw new Error('Invalid report type');
        }
        
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        toast({
          title: 'Export Successful',
          description: `The ${reportType} report is downloading.`,
        });
      } catch (error) {
        console.error('Export failed:', error);
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: 'Could not generate or download the report.',
        });
      } finally {
        setActiveReport(null);
      }
    });
  };

  const isGenerating = (reportType: ReportType) => isPending && activeReport === reportType;

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/50 h-full space-y-4">
      <Button onClick={() => handleExport('all')} disabled={isPending} size="lg" className="w-full bg-primary/90 hover:bg-primary">
        {isGenerating('all') ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating All...
          </>
        ) : (
          <>
            <Package className="mr-2 h-4 w-4" />
            Export All Data
          </>
        )}
      </Button>
      <div className="w-full flex items-center gap-2">
        <div className="flex-grow border-t border-border"></div>
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="flex-grow border-t border-border"></div>
      </div>
      <Button onClick={() => handleExport('consumption')} disabled={isPending} size="lg" className="w-full">
        {isGenerating('consumption') ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Utensils className="mr-2 h-4 w-4" />
            Export Consumption
          </>
        )}
      </Button>
       <Button onClick={() => handleExport('attendance')} disabled={isPending} size="lg" className="w-full">
        {isGenerating('attendance') ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Export Attendance
          </>
        )}
      </Button>
       <Button onClick={() => handleExport('leave')} disabled={isPending} size="lg" className="w-full">
        {isGenerating('leave') ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <CalendarOff className="mr-2 h-4 w-4" />
            Export Leave
          </>
        )}
      </Button>
    </div>
  );
}
