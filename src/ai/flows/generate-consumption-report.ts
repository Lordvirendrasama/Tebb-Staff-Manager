'use server';

/**
 * @fileOverview Generates a report summarizing food and drink consumption data for all employees.
 *
 * - generateConsumptionReport - A function that generates the consumption report.
 * - GenerateConsumptionReportInput - The input type for the generateConsumptionReport function (currently empty).
 * - GenerateConsumptionReportOutput - The return type for the generateConsumptionReport function, a string in CSV format.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getAllConsumptionLogs} from '@/services/consumption-log-service';

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
  input: {schema: GenerateConsumptionReportInputSchema},
  output: {schema: GenerateConsumptionReportOutputSchema},
  prompt: `You are an expert report generator. You take in consumption data and output a formatted report.

       The report should be in CSV format with the following columns: Employee Name, Item Name, Date & Time Logged.

       Here is the consumption data:
       {{consumptionData}}`,
});

const generateConsumptionReportFlow = ai.defineFlow(
  {
    name: 'generateConsumptionReportFlow',
    inputSchema: GenerateConsumptionReportInputSchema,
    outputSchema: GenerateConsumptionReportOutputSchema,
  },
  async input => {
    const consumptionLogs = await getAllConsumptionLogs();

    // Format the consumption data for the prompt
    const consumptionData = consumptionLogs
      .map(
        log =>
          `${log.employeeName},${log.itemName},${log.dateTimeLogged.toISOString()}`
      )
      .join('\n');

    const {output} = await prompt({consumptionData});
    return output!;
  }
);
