
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { generateConsumptionReport } from '@/ai/flows/generate-consumption-report';
import { generateAttendanceReport } from '@/ai/flows/generate-attendance-report';
import { generateLeaveReport } from '@/ai/flows/generate-leave-report';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Utensils, Clock, CalendarOff, Package } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
        zip.file(`consumption-report-${date}.xml`, consumptionData);
        zip.file(`attendance-report-${date}.xml`, attendanceData);
        zip.file(`leave-report-${date}.xml`, leaveData);

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `all-reports-${date}.zip`);

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
        let xmlData: string;
        let fileName: string;
        const date = new Date().toISOString().split('T')[0];

        switch (reportType) {
          case 'consumption':
            xmlData = await generateConsumptionReport({});
            fileName = `consumption-report-${date}.xml`;
            break;
          case 'attendance':
            xmlData = await generateAttendanceReport({});
            fileName = `attendance-report-${date}.xml`;
            break;
          case 'leave':
            xmlData = await generateLeaveReport({});
            fileName = `leave-report-${date}.xml`;
            break;
          default:
            throw new Error('Invalid report type');
        }
        
        const blob = new Blob([xmlData], { type: 'application/xml;charset=utf-8;' });
        saveAs(blob, fileName);
        
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
