
'use client';

import * as serverService from '../consumption-log-service';

// This file exports server functions for client-side use.
// This is the correct way to expose server functions to client components
// without marking the entire service file as a client module.

export const getLogsForUser = serverService.getLogsForUser;
export const getRemainingAllowances = serverService.getRemainingAllowances;
