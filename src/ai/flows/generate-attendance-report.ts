
'use server';

/**
 * @fileOverview Generates a report summarizing attendance data for all employees.
 *
 * - generateAttendanceReport - A function that generates the attendance report.
 * - GenerateAttendanceReportInput - The input type for the generateAttendanceReport function (currently empty).
 * - GenerateAttendanceReportOutput - The return type for the generateAttendanceReport function, a string in XML format.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminDb } from '@/lib/firebase';
import type { AttendanceLog } from '@/lib/constants';
import { format } from 'date-fns';

const GenerateAttendanceReportInputSchema = z.object({});
export type GenerateAttendanceReportInput = z.infer<typeof GenerateAttendanceReportInputSchema>;

const GenerateAttendanceReportOutputSchema = z.string();
export type GenerateAttendanceReportOutput = z.infer<typeof GenerateAttendanceReportOutputSchema>;

export async function generateAttendanceReport(
  input: GenerateAttendanceReportInput
): Promise<GenerateAttendanceReportOutput> {
  return generateAttendanceReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAttendanceReportPrompt',
  input: {schema: z.object({ attendanceData: z.string() })},
  output: {schema: GenerateAttendanceReportOutputSchema},
  prompt: `You are an expert report generator. You take in attendance data and output a formatted report.

       The report should be in XML format. The root element should be <attendanceLogs>, and each entry should be a <log> element with <employeeName>, <clockIn>, and <clockOut> child elements.

       If there is no data, return an empty <attendanceLogs/> element.

       Here is the attendance data:
       {{{attendanceData}}}`,
});

async function getAttendanceData(): Promise<string> {
    if (!adminDb) {
        return '';
    }
    const snapshot = await adminDb.collection('attendance-logs').orderBy('clockIn', 'desc').get();
    const logs = snapshot.docs.map(doc => {
        const data = doc.data() as AttendanceLog;
        return {
            ...data,
            clockIn: format(data.clockIn.toDate(), 'yyyy-MM-dd HH:mm:ss'),
            clockOut: data.clockOut ? format(data.clockOut.toDate(), 'yyyy-MM-dd HH:mm:ss') : undefined,
        };
    });
    return JSON.stringify(logs, null, 2);
}

const generateAttendanceReportFlow = ai.defineFlow(
  {
    name: 'generateAttendanceReportFlow',
    inputSchema: GenerateAttendanceReportInputSchema,
    outputSchema: GenerateAttendanceReportOutputSchema,
  },
  async input => {
    const attendanceData = await getAttendanceData();
    const {output} = await prompt({attendanceData});
    return output!;
  }
);
