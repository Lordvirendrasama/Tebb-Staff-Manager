
'use server';

/**
 * @fileOverview Generates a report summarizing food and drink consumption data for all employees.
 *
 * - generateConsumptionReport - A function that generates the consumption report.
 * - GenerateConsumptionReportInput - The input type for the generateConsumptionReport function (currently empty).
 * - GenerateConsumptionReportOutput - The return type for the generateConsumptionReport function, a string in XML format.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminDb } from '@/lib/firebase';
import type { ConsumptionLog } from '@/lib/constants';
import { format } from 'date-fns';

const GenerateConsumptionReportInputSchema = z.object({});
export type GenerateConsumptionReportInput = z.infer<typeof GenerateConsumptionReportInputSchema>;

const GenerateConsumptionReportOutputSchema = z.string();
export type GenerateConsumptionReportOutput = z.infer<typeof GenerateConsumptionReportOutputSchema>;

export async function generateConsumptionReport(
  input: GenerateConsumptionReportInput
): Promise<GenerateConsumptionReportOutput> {
  return generateConsumptionReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConsumptionReportPrompt',
  input: {schema: z.object({ consumptionData: z.string() })},
  output: {schema: GenerateConsumptionReportOutputSchema},
  prompt: `You are an expert report generator. You take in consumption data and output a formatted report.

       The report should be in XML format. The root element should be <consumptionLogs>, and each entry should be a <log> element with <employeeName>, <itemName>, and <dateTimeLogged> child elements.

       If there is no data, return an empty <consumptionLogs/> element.

       Here is the consumption data:
       {{{consumptionData}}}`,
});

async function getConsumptionData(): Promise<string> {
    if (!adminDb) {
        return '';
    }
    const snapshot = await adminDb.collection('consumption-logs').orderBy('dateTimeLogged', 'desc').get();
    const logs = snapshot.docs.map(doc => {
        const data = doc.data() as ConsumptionLog;
        return {
            ...data,
            dateTimeLogged: format(data.dateTimeLogged.toDate(), 'yyyy-MM-dd HH:mm:ss'),
        };
    });
    return JSON.stringify(logs, null, 2);
}

const generateConsumptionReportFlow = ai.defineFlow(
  {
    name: 'generateConsumptionReportFlow',
    inputSchema: GenerateConsumptionReportInputSchema,
    outputSchema: GenerateConsumptionReportOutputSchema,
  },
  async input => {
    const consumptionData = await getConsumptionData();

    const {output} = await prompt({consumptionData});
    return output!;
  }
);
