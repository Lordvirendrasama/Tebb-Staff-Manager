import { config } from 'dotenv';
config();

import '@/ai/flows/generate-consumption-report.ts';
import '@/ai/flows/generate-attendance-report.ts';
import '@/ai/flows/generate-leave-report.ts';
