
'use client';

import * as serverService from '../attendance-service';

// This file exports server functions for client-side use.
// This is the correct way to expose server functions to client components
// without marking the entire service file as a client module.

export const getAttendanceStatus = serverService.getAttendanceStatus;
export const getAttendanceHistory = serverService.getAttendanceHistory;
export const getMonthlyOvertime = serverService.getMonthlyOvertime;
export const getEmployees = serverService.getEmployees;
export const addEmployee = serverService.addEmployee;
export const getLeaveRequestsForUser = serverService.getLeaveRequestsForUser;
export const getAllLeaveRequests = serverService.getAllLeaveRequests;
export const getMonthlyLeaves = serverService.getMonthlyLeaves;
export const getAllUsersAllowances = serverService.getAllUsersAllowances;
