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
import {getAllAttendanceLogs} from '@/services/attendance-service';

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

       Here is the attendance data:
       {{{attendanceData}}}`,
});

const generateAttendanceReportFlow = ai.defineFlow(
  {
    name: 'generateAttendanceReportFlow',
    inputSchema: GenerateAttendanceReportInputSchema,
    outputSchema: GenerateAttendanceReportOutputSchema,
  },
  async input => {
    const attendanceLogs = await getAllAttendanceLogs();

    // Format the attendance data for the prompt
    const attendanceData = attendanceLogs
      .map(
        log =>
          `${log.employeeName},${log.clockIn.toISOString()},${log.clockOut ? log.clockOut.toISOString() : 'N/A'}`
      )
      .join('\n');

    const {output} = await prompt({attendanceData});
    return output!;
  }
);
