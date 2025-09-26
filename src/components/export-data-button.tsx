
'use client';

import { useTransition } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { exportAllData, exportPayrollData } from '@/services/export-service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export function ExportDataButton() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleExport = (exportFunc: () => Promise<void>, type: string) => {
        startTransition(async () => {
            try {
                await exportFunc();
                toast({ title: 'Success', description: `${type} data exported successfully!` });
            } catch (error) {
                console.error(`Export failed for ${type}:`, error);
                toast({ variant: 'destructive', title: 'Error', description: `Failed to export ${type} data.` });
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isPending} variant="secondary" className="w-full">
                    {isPending ? <Loader2 className="animate-spin" /> : <Download />}
                    Export Data
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport(exportAllData, 'Master')} disabled={isPending}>
                    <Download className="mr-2 h-4 w-4"/>
                    Export Master Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(exportPayrollData, 'Payroll')} disabled={isPending}>
                    <FileSpreadsheet className="mr-2 h-4 w-4"/>
                    Export Payrolls
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
