
'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateConsumptionReport } from '@/ai/flows/generate-consumption-report';
import { generateAttendanceReport } from '@/ai/flows/generate-attendance-report';
import { generateLeaveReport } from '@/ai/flows/generate-leave-report';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Utensils, Clock, CalendarOff } from 'lucide-react';

type ReportType = 'consumption' | 'attendance' | 'leave';

export function AdminDashboard() {
  const [isPending, startTransition] = useTransition();
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const { toast } = useToast();

  const handleExport = (reportType: ReportType) => {
    startTransition(async () => {
      setActiveReport(reportType);
      try {
        let csvData: string;
        let fileName: string;

        switch (reportType) {
          case 'consumption':
            csvData = await generateConsumptionReport({});
            fileName = `consumption-report-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'attendance':
            csvData = await generateAttendanceReport({});
            fileName = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
            break;
          case 'leave':
            csvData = await generateLeaveReport({});
            fileName = `leave-report-${new Date().toISOString().split('T')[0]}.csv`;
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
