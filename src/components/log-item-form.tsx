'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FOOD_ITEMS } from '@/lib/constants';
import type { User, FoodItem } from '@/lib/constants';
import { logItemAction } from '@/app/actions';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const FormSchema = z.object({
  itemName: z.enum(FOOD_ITEMS, {
    required_error: "You need to select an item.",
  }),
});

export function LogItemForm({ user, allowance }: { user: User; allowance: number }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      const result = await logItemAction(user, data.itemName as FoodItem);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        form.reset({ itemName: undefined });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  }

  const hasAllowance = allowance > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="itemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!hasAllowance || isPending}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item to log" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FOOD_ITEMS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={!hasAllowance || isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
            </>
          ) : (
             "Log Item"
          )}
        </Button>
      </form>
    </Form>
  );
}
