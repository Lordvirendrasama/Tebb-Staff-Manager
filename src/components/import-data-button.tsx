
'use client';

import { useTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { importDataAction } from '@/app/actions/data-actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export function ImportDataButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const jsonData = JSON.parse(content);
            // Basic validation to ensure it's the right kind of file
            if ('consumptionLogs' in jsonData && 'attendanceLogs' in jsonData) {
                startTransition(async () => {
                    const result = await importDataAction(jsonData);
                     if (result.success) {
                        toast({ title: 'Success!', description: result.message });
                    } else {
                        toast({ variant: 'destructive', title: 'Error', description: result.message });
                    }
                });
            } else {
              toast({ variant: 'destructive', title: 'Error', description: 'Invalid JSON file structure.' });
            }
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to parse JSON file.' });
        } finally {
            // Reset file input
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
                Import Data
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    Importing a new data file will overwrite all existing data. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleButtonClick}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/json"
            onChange={handleFileSelect}
        />
    </AlertDialog>
  );
}
