
'use client';

import { useTransition } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { seedDatabaseAction } from '@/app/actions/admin-actions';
import { Loader2, Database } from 'lucide-react';

export function SeedDatabaseButton() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSeed = () => {
        startTransition(async () => {
            const result = await seedDatabaseAction();
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <Button onClick={handleSeed} disabled={isPending} variant="secondary" className="w-full">
            {isPending ? <Loader2 className="animate-spin" /> : <Database />}
            Seed Database
        </Button>
    );
}
