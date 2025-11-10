'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Save, Edit, ArrowUpDown, Filter, Calendar } from 'lucide-react';
import { getAttendanceLogs } from '@/services/client/attendance-service';
import { updateAttendanceLogAction, deleteAttendanceLogAction } from '@/app/actions/attendance-actions';
import { format, getMonth, getYear, setMonth, setYear, differenceInMinutes, parse } from 'date-fns';
import type { Employee, User, AttendanceLog } from '@/lib/constants';
import { formatIST, toIST } from '@/lib/date-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type SortKey = 'employeeName' | 'clockIn';

export function AttendanceManager({ employees }: { employees: Employee[] }) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filtering and Sorting
  const [filters, setFilters] = useState<{ employee: User | 'all'; month: number; year: number }>({
    employee: 'all',
    month: getMonth(new Date()),
    year: getYear(new Date()),
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'clockIn', direction: 'desc' });

  // Editing
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    const monthDate = setYear(setMonth(new Date(), filters.month), filters.year);
    try {
      const fetchedLogs = await getAttendanceLogs({
        employeeName: filters.employee === 'all' ? null : filters.employee,
        month: monthDate
      });
      setLogs(fetchedLogs as AttendanceLog[]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance logs.' });
    } finally {
      setLoading(false);
    }
  };

  const sortedLogs = useMemo(() => {
    let sortableLogs = [...logs];
    if (sortConfig !== null) {
      sortableLogs.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableLogs;
  }, [logs, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const dateTimeFormat = 'MM/dd/yyyy hh:mm a';

  const handleEditClick = (log: AttendanceLog) => {
    const employee = employees.find(e => e.name === log.employeeName);
    const logDate = new Date(log.clockIn);

    let clockInDateTime;
    if (log.clockIn) {
        clockInDateTime = new Date(log.clockIn);
    } else if (employee?.shiftStartTime) {
        const [hours, minutes] = employee.shiftStartTime.split(':').map(Number);
        clockInDateTime = new Date(logDate.setHours(hours, minutes));
    } else {
        clockInDateTime = logDate;
    }

    let clockOutDateTime;
    if (log.clockOut) {
        clockOutDateTime = new Date(log.clockOut);
    } else if (employee?.shiftEndTime) {
        const [hours, minutes] = employee.shiftEndTime.split(':').map(Number);
        clockOutDateTime = new Date(logDate.setHours(hours, minutes));
        if (clockOutDateTime <= clockInDateTime) {
             clockOutDateTime.setDate(clockOutDateTime.getDate() + 1);
        }
    }

    setEditingLog(log);
    setEditClockIn(format(clockInDateTime, dateTimeFormat));
    setEditClockOut(clockOutDateTime ? format(clockOutDateTime, dateTimeFormat) : '');
  };

  const handleSave = () => {
    if (!editingLog || !editClockIn) return;

    try {
        const newClockIn = parse(editClockIn, dateTimeFormat, new Date());
        const newClockOut = editClockOut ? parse(editClockOut, dateTimeFormat, new Date()) : null;

        if (isNaN(newClockIn.getTime()) || (newClockOut && isNaN(newClockOut.getTime()))) {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid date format. Please use MM/DD/YYYY hh:mm AM/PM' });
            return;
        }

        startTransition(async () => {
          const result = await updateAttendanceLogAction(editingLog.id, newClockIn.toISOString(), newClockOut ? newClockOut.toISOString() : null);
          if (result.success) {
            toast({ title: 'Success', description: result.message });
            setEditingLog(null);
            fetchLogs();
          } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
          }
        });

    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid date format. Please use MM/DD/YYYY hh:mm AM/PM' });
    }
  };

  const handleDelete = (logId: string) => {
    startTransition(async () => {
      const result = await deleteAttendanceLogAction(logId);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        fetchLogs();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const calculateHours = (start: Date, end: Date | undefined) => {
    if (!end) return '-';
    const minutes = differenceInMinutes(new Date(end), new Date(start));
    if (minutes < 0) return '-';
    const hours = (minutes / 60).toFixed(2);
    return `${hours} hrs`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Manager</CardTitle>
        <CardDescription>View, sort, filter, and edit all attendance records.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/50 items-center">
          <Filter className="h-5 w-5 text-muted-foreground hidden sm:block" />
          <Select value={filters.employee} onValueChange={(val) => setFilters(f => ({ ...f, employee: val as User }))}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={filters.month.toString()} onValueChange={(m) => setFilters(f => ({ ...f, month: parseInt(m) }))}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => <SelectItem key={i} value={i.toString()}>{format(new Date(0, i), 'MMMM')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.year.toString()} onValueChange={(y) => setFilters(f => ({ ...f, year: parseInt(y) }))}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i).map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('employeeName')}>
                    Employee <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('clockIn')}>
                    Date <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
              ) : sortedLogs.length > 0 ? sortedLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.employeeName}</TableCell>
                  <TableCell>{formatIST(new Date(log.clockIn), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{formatIST(new Date(log.clockIn), 'p')}</TableCell>
                  <TableCell>{log.clockOut ? formatIST(new Date(log.clockOut), 'p') : 'N/A'}</TableCell>
                  <TableCell>{calculateHours(new Date(log.clockIn), log.clockOut ? new Date(log.clockOut) : undefined)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(log)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this attendance record. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(log.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="text-center h-24">No records found for the selected filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!editingLog} onOpenChange={(isOpen) => !isOpen && setEditingLog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Attendance</DialogTitle>
              <DialogDescription>
                Editing log for {editingLog?.employeeName} on {editingLog && formatIST(new Date(editingLog.clockIn), 'PPP')}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-clock-in">Clock In</Label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="edit-clock-in" type="text" value={editClockIn} onChange={e => setEditClockIn(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-clock-out">Clock Out</Label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="edit-clock-out" type="text" value={editClockOut} onChange={e => setEditClockOut(e.target.value)} placeholder="MM/DD/YYYY hh:mm AM/PM" className="pl-9" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
