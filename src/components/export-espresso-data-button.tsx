
'use client';

import { useTransition } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Coffee } from 'lucide-react';
import { exportEspressoData } from '@/services/export-service';

export function ExportEspressoDataButton() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleExport = () => {
        startTransition(async () => {
            try {
                await exportEspressoData();
                toast({ title: 'Success', description: 'Espresso logs exported successfully!' });
            } catch (error) {
                console.error('Export failed:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to export espresso logs.' });
            }
        });
    };

    return (
        <Button onClick={handleExport} disabled={isPending} variant="secondary" className="w-full">
            {isPending ? <Loader2 className="animate-spin" /> : <Coffee />}
            Export Espresso Logs
        </Button>
    );
}
