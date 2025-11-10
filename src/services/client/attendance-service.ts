
'use client';

import * as serverService from '../attendance-service';
import { getAttendanceForMonthAction } from '@/app/actions/attendance-actions';

export const getAttendanceStatus = serverService.getAttendanceStatus;
export const getAttendanceHistory = serverService.getAttendanceHistory;
export const getEmployees = serverService.getEmployees;
export const addEmployee = serverService.addEmployee;
export const getAttendanceForMonth = getAttendanceForMonthAction;
