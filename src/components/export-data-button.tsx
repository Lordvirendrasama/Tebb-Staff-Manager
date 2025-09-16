
'use client';

import { useTransition } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { exportAllData } from '@/services/export-service';

export function ExportDataButton() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleExport = () => {
        startTransition(async () => {
            try {
                await exportAllData();
                toast({ title: 'Success', description: 'Data exported successfully!' });
            } catch (error) {
                console.error('Export failed:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to export data.' });
            }
        });
    };

    return (
        <Button onClick={handleExport} disabled={isPending} variant="secondary" className="w-full">
            {isPending ? <Loader2 className="animate-spin" /> : <Download />}
            Export All Data
        </Button>
    );
}
