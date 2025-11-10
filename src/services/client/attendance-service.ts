
'use client';

import * as serverService from '../attendance-service';

export const getAttendanceStatus = serverService.getAttendanceStatus;
export const getAttendanceHistory = serverService.getAttendanceHistory;
export const getEmployees = serverService.getEmployees;
export const addEmployee = serverService.addEmployee;
