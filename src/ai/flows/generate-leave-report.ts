'use server';

/**
 * @fileOverview Generates a report summarizing leave request data for all employees.
 *
 * - generateLeaveReport - A function that generates the leave report.
 * - GenerateLeaveReportInput - The input type for the generateLeaveReport function (currently empty).
 * - GenerateLeaveReportOutput - The return type for the generateLeaveReport function, a string in CSV format.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getAllLeaveRequests} from '@/services/attendance-service';

const GenerateLeaveReportInputSchema = z.object({});
export type GenerateLeaveReportInput = z.infer<typeof GenerateLeaveReportInputSchema>;

const GenerateLeaveReportOutputSchema = z.string();
export type GenerateLeaveReportOutput = z.infer<typeof GenerateLeaveReportOutputSchema>;

export async function generateLeaveReport(
  input: GenerateLeaveReportInput
): Promise<GenerateLeaveReportOutput> {
  return generateLeaveReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLeaveReportPrompt',
  input: {schema: z.object({ leaveData: z.string() })},
  output: {schema: GenerateLeaveReportOutputSchema},
  prompt: `You are an expert report generator. You take in leave request data and output a formatted report.

       The report should be in CSV format with the following columns: Employee Name, Leave Date, Reason, Status.

       Here is the leave data:
       {{{leaveData}}}`,
});

const generateLeaveReportFlow = ai.defineFlow(
  {
    name: 'generateLeaveReportFlow',
    inputSchema: GenerateLeaveReportInputSchema,
    outputSchema: GenerateLeaveReportOutputSchema,
  },
  async input => {
    const leaveRequests = await getAllLeaveRequests();

    // Format the leave data for the prompt
    const leaveData = leaveRequests
      .map(
        req =>
          `${req.employeeName},${req.leaveDate.toISOString()},"${req.reason.replace(/"/g, '""')}",${req.status}`
      )
      .join('\n');

    const {output} = await prompt({leaveData});
    return output!;
  }
);
