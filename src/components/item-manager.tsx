
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Save, Edit, Trash2, GlassWater, Soup } from 'lucide-react';
import type { ConsumableItemDef, ItemType } from '@/lib/constants';
import { ITEM_TYPES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { addItemAction, updateItemAction, deleteItemAction } from '@/app/actions/admin-actions';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function ItemManager({ items }: { items: ConsumableItemDef[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [editingItem, setEditingItem] = useState<ConsumableItemDef | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType | ''>('');

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingItem(null);
    setName('');
    setType('');
  };

  const handleEdit = (item: ConsumableItemDef) => {
    setEditingItem(item);
    setIsAdding(false);
    setName(item.name);
    setType(item.type);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingItem(null);
    setName('');
    setType('');
  };

  const handleSave = () => {
    if (!name || !type) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
      return;
    }

    startTransition(async () => {
      const action = editingItem ? 
        updateItemAction(editingItem.id, name, type as ItemType) : 
        addItemAction(name, type as ItemType);
      const result = await action;

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        handleCancel();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      const result = await deleteItemAction(itemId);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Items</CardTitle>
        <CardDescription>Add, edit, or remove menu items.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
             <div className="flex items-center gap-2 text-sm">
                {item.type === 'Drink' ? <GlassWater className="h-4 w-4 text-muted-foreground" /> : <Soup className="h-4 w-4 text-muted-foreground" />}
                <p className="font-medium truncate">{item.name}</p>
            </div>
            <div className="flex flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={isPending}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {item.name} from the menu. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(item.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                      {isPending ? <Loader2 className="animate-spin" /> : 'Remove'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {!isAdding && !editingItem && (
            <Button onClick={handleAddNew} className="w-full">
                <Plus /> Add New Item
            </Button>
        )}

        {(isAdding || editingItem) && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm">{editingItem ? 'Edit Item' : 'Add New Item'}</h4>
            <div>
                <Label htmlFor="item-name">Item Name</Label>
                <Input 
                  id="item-name"
                  placeholder="e.g. Pizza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                />
            </div>
             <div>
                <Label>Item Type</Label>
                <Select onValueChange={(value) => setType(value as ItemType)} value={type} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCancel} variant="outline" className="w-full" disabled={isPending}>Cancel</Button>
              <Button onClick={handleSave} className="w-full" disabled={isPending || !name || !type}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
