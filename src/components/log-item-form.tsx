'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, ConsumableItem, ConsumableItemDef } from '@/lib/constants';
import { logItemAction } from '@/app/actions';
import { useTransition, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getConsumableItems } from '@/services/client/consumption-log-service';

const FormSchema = z.object({
  itemName: z.string({
    required_error: "You need to select an item.",
  }),
});

export function LogItemForm({ user, allowances }: { user: User; allowances: { drinks: number, meals: number } }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [items, setItems] = useState<ConsumableItemDef[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    getConsumableItems()
      .then(setItems)
      .finally(() => setLoadingItems(false));
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      const result = await logItemAction(user, data.itemName as ConsumableItem);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  }
  
  const selectedItemName = form.watch('itemName');
  const selectedItem = items.find(item => item.name === selectedItemName);

  let disabled = !selectedItemName || isPending || loadingItems;
  if (selectedItem) {
    if (selectedItem.type === 'Drink' && allowances.drinks <= 0) disabled = true;
    if (selectedItem.type === 'Meal' && allowances.meals <= 0) disabled = true;
  }
  
  const drinkItems = items.filter(item => item.type === 'Drink');
  const mealItems = items.filter(item => item.type === 'Meal');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="itemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isPending || loadingItems}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingItems ? "Loading items..." : "Select an item to log"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {drinkItems.length > 0 && (
                     <SelectGroup>
                      <SelectLabel>Drinks</SelectLabel>
                      {drinkItems.map((item) => (
                        <SelectItem key={item.id} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {mealItems.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Meals</SelectLabel>
                      {mealItems.map((item) => (
                        <SelectItem key={item.id} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={disabled}>
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
