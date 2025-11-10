
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import type { Employee, AttendanceLog } from '@/lib/constants';
import { getAttendanceForMonth } from '@/services/client/attendance-service';
import { updateAttendanceForRangeAction, updateAttendanceForDayAction, updateAttendanceTimesAction } from '@/app/actions/attendance-actions';
import { useToast } from '@/hooks/use-toast';
import { addMonths, format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, X, Check, Edit, Save, Trash2, Clock } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EditingState {
    log: AttendanceLog | null; // Can be null if creating a new log
    day: Date;
}

export function AttendanceEditor({ employees, onUpdate }: { employees: Employee[], onUpdate: () => void }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
    const [workedLogs, setWorkedLogs] = useState<AttendanceLog[]>([]);
    const [range, setRange] = useState<DateRange | undefined>();
    const [selectedDay, setSelectedDay] = useState<Date | undefined>();
    const [editingState, setEditingState] = useState<EditingState | null>(null);

    const [clockInTime, setClockInTime] = useState('');
    const [clockOutTime, setClockOutTime] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [isUpdating, startUpdateTransition] = useTransition();
    const { toast } = useToast();

    const employee = employees.find(e => e.id === selectedEmployeeId);

    const fetchAttendance = () => {
        if (selectedEmployeeId && employee) {
            setLoading(true);
            getAttendanceForMonth(employee.name, currentMonth).then(logs => {
                setWorkedLogs(logs);
                setLoading(false);
            });
        } else {
            setWorkedLogs([]);
        }
    };
    
    useEffect(() => {
        fetchAttendance();
        setRange(undefined);
        setSelectedDay(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployeeId, currentMonth]);

    useEffect(() => {
        if (editingState?.log) {
            setClockInTime(format(new Date(editingState.log.clockIn), 'HH:mm'));
            if(editingState.log.clockOut) {
                setClockOutTime(format(new Date(editingState.log.clockOut), 'HH:mm'));
            } else {
                setClockOutTime('');
            }
        } else if (editingState && employee?.shiftStartTime && employee?.shiftEndTime) {
            // Pre-fill with default shift times if creating a new log
            setClockInTime(employee.shiftStartTime);
            setClockOutTime(employee.shiftEndTime);
        } else {
            setClockInTime('');
            setClockOutTime('');
        }
    }, [editingState, employee]);

    const handleRangeUpdate = (worked: boolean) => {
        if (!range?.from || !range.to || !selectedEmployeeId) return;

        startUpdateTransition(async () => {
            const result = await updateAttendanceForRangeAction(selectedEmployeeId, range.from!, range.to!, worked);
            
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                fetchAttendance();
                onUpdate();
                setRange(undefined);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };
    
    const handleDayClick = (day: Date | undefined) => {
        if (range) return; // Don't trigger day click if in range selection mode
        setSelectedDay(day);
    };

    const handleEditClick = () => {
        if (!selectedDay) return;
        const logForDay = workedLogs.find(log => format(new Date(log.clockIn), 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd'));
        setEditingState({ log: logForDay || null, day: selectedDay });
    }
    
    const handleSaveChanges = () => {
        if (!editingState || !employee) return;

        startUpdateTransition(async () => {
            if (editingState.log) {
                 const result = await updateAttendanceTimesAction(editingState.log.id, clockInTime, clockOutTime);
                if (result.success) {
                    toast({ title: 'Success', description: result.message });
                    fetchAttendance();
                    onUpdate();
                    setEditingState(null);
                    setSelectedDay(undefined);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.message });
                }
            } else {
                // Creating new log
                const result = await updateAttendanceForDayAction(employee.id, editingState.day, true, clockInTime, clockOutTime);
                if (result.success) {
                    toast({ title: 'Success', description: result.message });
                    fetchAttendance();
                    onUpdate();
                    setEditingState(null);
                    setSelectedDay(undefined);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.message });
                }
            }
           
        });
    }

    const handleDeleteAttendance = () => {
        if (!editingState || !editingState.log || !selectedEmployeeId) return; // Can't delete if no log exists

        startUpdateTransition(async () => {
            const result = await updateAttendanceForDayAction(selectedEmployeeId, editingState.day, false);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                fetchAttendance();
                onUpdate();
                setEditingState(null);
                setSelectedDay(undefined);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    }

    const changeMonth = (offset: number) => {
        setCurrentMonth(prev => addMonths(prev, offset));
    };

    const modifiers = {
        worked: workedLogs.map(log => new Date(log.clockIn)),
        selected: selectedDay,
    };

    const modifiersStyles = {
        worked: {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
        },
        selected: {
            backgroundColor: 'hsl(var(--accent))',
            color: 'hsl(var(--accent-foreground))'
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance Editor</CardTitle>
                <CardDescription>Select a date range, or click a day to edit or toggle attendance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium text-center w-32">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-1 border rounded-lg relative">
                    {(loading || isUpdating) && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        </div>
                    )}
                     {!selectedEmployeeId ? (
                        <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                            Please select an employee to view their attendance.
                        </div>
                     ) : (
                        <Calendar
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            mode={range ? "range" : "single"}
                            selected={range || selectedDay}
                            onSelect={range ? setRange : setSelectedDay}
                            onDayClick={handleDayClick}
                            modifiers={modifiers}
                            modifiersStyles={modifiersStyles}
                            className="w-full"
                        />
                     )}
                </div>

                {editingState && (
                    <Dialog open={!!editingState} onOpenChange={(isOpen) => !isOpen && setEditingState(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Attendance</DialogTitle>
                                <DialogDescription>
                                    Editing attendance for {employee?.name} on {format(editingState.day, 'PPP')}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="clock-in">Clock In</Label>
                                        <Input
                                            id="clock-in"
                                            type="time"
                                            value={clockInTime}
                                            onChange={(e) => setClockInTime(e.target.value)}
                                            disabled={isUpdating}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clock-out">Clock Out</Label>
                                        <Input
                                            id="clock-out"
                                            type="time"
                                            value={clockOutTime}
                                            onChange={(e) => setClockOutTime(e.target.value)}
                                            disabled={isUpdating}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="sm:justify-between gap-2">
                                <div>
                                    {editingState.log && (
                                        <Button variant="destructive" onClick={handleDeleteAttendance} disabled={isUpdating}>
                                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                            Not Worked
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary" disabled={isUpdating}>Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleSaveChanges} disabled={isUpdating || !clockInTime || !clockOutTime}>
                                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save / Mark Worked
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}


                {range?.from && (
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-3">
                           <div className="text-sm font-medium">
                                Update range: {format(range.from, "PPP")} {range.to && ` - ${format(range.to, "PPP")}`}
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" onClick={() => setRange(undefined)}>
                                    <X className="mr-2 h-4 w-4" /> Clear Range
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRangeUpdate(false)} disabled={!range.to}>
                                    <X className="mr-2 h-4 w-4" /> Mark as Not Worked
                                </Button>
                                <Button size="sm" onClick={() => handleRangeUpdate(true)} disabled={!range.to}>
                                    <Check className="mr-2 h-4 w-4" /> Mark as Worked
                                </Button>
                           </div>
                        </CardContent>
                    </Card>
                )}

                {selectedDay && !range && (
                     <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-3">
                           <div className="text-sm font-medium">
                                Selected Day: {format(selectedDay, "PPP")}
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedDay(undefined)}>
                                    <X className="mr-2 h-4 w-4" /> Clear Selection
                                </Button>
                                <Button size="sm" onClick={handleEditClick} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                                    Edit Attendance
                                </Button>
                           </div>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    );
}
