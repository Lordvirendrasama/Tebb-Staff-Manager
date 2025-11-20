
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Calendar as CalendarIcon, Plus, Check, X } from 'lucide-react';
import { getLeaveRequestsAction, updateLeaveStatusAction, deleteLeaveRequestAction, addLeaveRequestAction } from '@/app/actions/leave-actions';
import { format, differenceInDays } from 'date-fns';
import type { Employee, User, LeaveRequest, LeaveType, LeaveStatus } from '@/lib/constants';
import { LEAVE_TYPES, LEAVE_STATUSES } from '@/lib/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

type SortKey = 'employeeName' | 'startDate' | 'status';

export function LeaveManager({ employees }: { employees: Employee[] }) {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newRequestData, setNewRequestData] = useState<{
        employeeName: User | '';
        leaveType: LeaveType | '';
        dateRange: { from: Date | undefined, to: Date | undefined };
        reason: string;
    }>({
        employeeName: '',
        leaveType: '',
        dateRange: { from: undefined, to: undefined },
        reason: ''
    });

    const [filters, setFilters] = useState<{ status: string; employee: string }>({
        status: 'all',
        employee: 'all'
    });

    const { toast } = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const requests = await getLeaveRequestsAction();
            setLeaveRequests(requests);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch leave requests.' });
        } finally {
            setLoading(false);
        }
    };
    
    const filteredRequests = useMemo(() => {
        return leaveRequests.filter(req => 
            (filters.status === 'all' || req.status === filters.status) &&
            (filters.employee === 'all' || req.employeeName === filters.employee)
        );
    }, [leaveRequests, filters]);


    const handleStatusChange = (id: string, status: LeaveStatus) => {
        startTransition(async () => {
            const result = await updateLeaveStatusAction(id, status);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                fetchRequests();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteLeaveRequestAction(id);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                fetchRequests();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleAddRequest = () => {
        const { employeeName, leaveType, dateRange, reason } = newRequestData;
        if (!employeeName || !leaveType || !dateRange.from || !dateRange.to) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
            return;
        }

        startTransition(async () => {
            const result = await addLeaveRequestAction({
                employeeName,
                leaveType: leaveType as LeaveType,
                startDate: dateRange.from as Date,
                endDate: dateRange.to as Date,
                reason,
            });
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsFormOpen(false);
                setNewRequestData({ employeeName: '', leaveType: '', dateRange: { from: undefined, to: undefined }, reason: '' });
                fetchRequests();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    }

    const getStatusColor = (status: LeaveStatus) => {
        switch(status) {
            case 'Approved': return 'text-green-500';
            case 'Rejected': return 'text-destructive';
            case 'Pending': return 'text-yellow-500';
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Leave Management</CardTitle>
                    <CardDescription>Approve, reject, or add new leave requests.</CardDescription>
                </div>
                <Button onClick={() => setIsFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Request</Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 p-4 mb-4 border rounded-lg bg-muted/50 items-center">
                    <Select value={filters.employee} onValueChange={(val) => setFilters(f => ({ ...f, employee: val }))}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by Employee..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.status} onValueChange={(val) => setFilters(f => ({ ...f, status: val }))}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by Status..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {LEAVE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                            ) : filteredRequests.length > 0 ? filteredRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.employeeName}</TableCell>
                                    <TableCell>{format(req.startDate, 'MMM d')} - {format(req.endDate, 'MMM d, yyyy')}</TableCell>
                                    <TableCell>{differenceInDays(req.endDate, req.startDate) + 1}</TableCell>
                                    <TableCell>{req.leaveType}</TableCell>
                                    <TableCell className={cn("font-semibold", getStatusColor(req.status))}>{req.status}</TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'Pending' && (
                                            <>
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(req.id, 'Approved')} disabled={isPending}>
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleStatusChange(req.id, 'Rejected')} disabled={isPending}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                            </>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete this leave request. This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(req.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={6} className="text-center h-24">No leave requests found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Leave Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Employee</Label>
                                <Select value={newRequestData.employeeName} onValueChange={val => setNewRequestData(d => ({ ...d, employeeName: val as User }))}>
                                    <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                                    <SelectContent>
                                        {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Leave Dates</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !newRequestData.dateRange.from && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newRequestData.dateRange.from ? 
                                                newRequestData.dateRange.to ? 
                                                `${format(newRequestData.dateRange.from, "LLL dd, y")} - ${format(newRequestData.dateRange.to, "LLL dd, y")}`
                                                : format(newRequestData.dateRange.from, "LLL dd, y")
                                            : <span>Pick a date range</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={newRequestData.dateRange}
                                            onSelect={(range) => setNewRequestData(d => ({ ...d, dateRange: range || { from: undefined, to: undefined } }))}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Leave Type</Label>
                                <Select value={newRequestData.leaveType} onValueChange={val => setNewRequestData(d => ({ ...d, leaveType: val as LeaveType }))}>
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Reason (Optional)</Label>
                                <Textarea value={newRequestData.reason} onChange={e => setNewRequestData(d => ({ ...d, reason: e.target.value }))} />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleAddRequest} disabled={isPending}>
                                {isPending ? <Loader2 className="animate-spin" /> : "Submit Request"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
