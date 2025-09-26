import type { Employee } from '@/lib/constants';

export async function getEmployees(): Promise<Employee[]> {
  try {
    const res = await fetch(
      'https://firestore.googleapis.com/v1/projects/staff-manager-e952a/databases/(default)/documents/employees',
      {
        cache: 'no-store', // Equivalent to SSR
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch employees: ${res.statusText}`);
    }

    const data = await res.json();

    if (!data.documents) {
      return [];
    }

    return data.documents.map((doc: any) => {
      const fields = doc.fields;
      return {
        name: fields.name.stringValue,
        weeklyOffDay: fields.weeklyOffDay.stringValue,
        standardWorkHours: parseInt(fields.standardWorkHours.integerValue, 10),
      };
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return []; // Return an empty array or handle the error as appropriate
  }
}
