
'use server';

/**
 * @fileOverview Generates a report summarizing leave request data for all employees.
 *
 * - generateLeaveReport - A function that generates the leave report.
 * - GenerateLeaveReportInput - The input type for the generateLeaveReport function (currently empty).
 * - GenerateLeaveReportOutput - The return type for the generateLeaveReport function, a string in XML format.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminDb } from '@/lib/firebase';
import type { LeaveRequest } from '@/lib/constants';
import { format } from 'date-fns';

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

       The report should be in XML format. The root element should be <leaveRequests>, and each entry should be a <request> element with <employeeName>, <leaveDate>, <reason>, and <status> child elements.

       If there is no data, return an empty <leaveRequests/> element.

       Here is the leave data:
       {{{leaveData}}}`,
});

async function getLeaveData(): Promise<string> {
    if (!adminDb) {
        return '';
    }
    const snapshot = await adminDb.collection('leave-requests').orderBy('leaveDate', 'desc').get();
    const requests = snapshot.docs.map(doc => {
        const data = doc.data() as LeaveRequest;
        return {
            ...data,
            leaveDate: format(data.leaveDate.toDate(), 'yyyy-MM-dd'),
        };
    });
    return JSON.stringify(requests, null, 2);
}

const generateLeaveReportFlow = ai.defineFlow(
  {
    name: 'generateLeaveReportFlow',
    inputSchema: GenerateLeaveReportInputSchema,
    outputSchema: GenerateLeaveReportOutputSchema,
  },
  async input => {
    const leaveData = await getLeaveData();

    const {output} = await prompt({leaveData});
    return output!;
  }
);
