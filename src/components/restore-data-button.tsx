
'use client';

import { useState, useTransition, useRef } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { restoreDataAction } from '@/app/actions/admin-actions';
import { Loader2, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function RestoreDataButton() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [backupContent, setBackupContent] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid JSON backup file.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setBackupContent(content);
            setShowConfirmDialog(true);
        };
        reader.readAsText(file);
    };

    const handleRestore = () => {
        if (!backupContent) return;

        startTransition(async () => {
            const result = await restoreDataAction(backupContent);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
            setShowConfirmDialog(false);
            setBackupContent(null);
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        });
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json"
            />
            <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Backup File
            </Button>
            
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will replace all current data with the data from the backup file. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBackupContent(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                            {isPending ? <Loader2 className="animate-spin" /> : 'Yes, restore data'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
