
'use client';

import { useTransition } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileSpreadsheet, Users, Clock, Utensils, Coffee } from 'lucide-react';
import { 
    exportMasterReport, 
    exportEmployeeDetails,
    exportAttendanceLogs,
    exportConsumptionLogs,
    exportEspressoData 
} from '@/services/export-service';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from './ui/dropdown-menu';

export function ExportDataButton() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleExport = (exportFunc: () => Promise<void>, type: string) => {
        startTransition(async () => {
            try {
                await exportFunc();
                toast({ title: 'Success', description: `${type} exported successfully!` });
            } catch (error) {
                console.error(`Export failed for ${type}:`, error);
                toast({ variant: 'destructive', title: 'Error', description: `Failed to export ${type}.` });
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button disabled={isPending} variant="secondary" className="w-full">
                    {isPending ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                    Export Data
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Reports</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport(exportMasterReport, 'Master Report')} disabled={isPending}>
                    <FileSpreadsheet className="mr-2 h-4 w-4"/>
                    <span>Master Report (.json)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Individual Datasets (.csv)</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport(exportEmployeeDetails, 'Employee Details')} disabled={isPending}>
                    <Users className="mr-2 h-4 w-4"/>
                    <span>Employee Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(exportAttendanceLogs, 'Attendance Logs')} disabled={isPending}>
                    <Clock className="mr-2 h-4 w-4"/>
                    <span>Attendance Logs</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleExport(exportConsumptionLogs, 'Consumption Logs')} disabled={isPending}>
                    <Utensils className="mr-2 h-4 w-4"/>
                    <span>Consumption Logs</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(exportEspressoData, 'Espresso Logs')} disabled={isPending}>
                    <Coffee className="mr-2 h-4 w-4"/>
                    <span>Espresso Logs</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
