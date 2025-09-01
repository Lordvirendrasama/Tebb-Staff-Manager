'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { generateConsumptionReport } from '@/ai/flows/generate-consumption-report';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

export function AdminDashboard() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const csvData = await generateConsumptionReport({});
        
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `consumption-report-${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        toast({
          title: 'Export Successful',
          description: 'The consumption report is downloading.',
        });
      } catch (error) {
        console.error('Export failed:', error);
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: 'Could not generate or download the report.',
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/50 h-full">
      <Button onClick={handleExport} disabled={isPending} size="lg">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </>
        )}
      </Button>
    </div>
  );
}
