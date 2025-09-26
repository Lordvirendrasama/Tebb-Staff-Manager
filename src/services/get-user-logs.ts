import type { ConsumptionLog, User } from '@/lib/constants';

export async function getUserLogs(user: User): Promise<ConsumptionLog[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const url = `https://firestore.googleapis.com/v1/projects/staff-manager-e952a/databases/(default)/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'consumptionLogs' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            { field: { fieldPath: 'employeeName' }, op: 'EQUAL', value: { stringValue: user } },
            {
              field: { fieldPath: 'dateTimeLogged' },
              op: 'GREATER_THAN_OR_EQUAL',
              value: { timestampValue: startOfMonth },
            },
            {
              field: { fieldPath: 'dateTimeLogged' },
              op: 'LESS_THAN_OR_EQUAL',
              value: { timestampValue: endOfMonth },
            },
          ],
        },
      },
      orderBy: [{ field: { fieldPath: 'dateTimeLogged' }, direction: 'DESCENDING' }],
    },
  };

  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), cache: 'no-store' });
  if (!res.ok) {
    console.error('Failed to fetch logs response:', await res.text());
    throw new Error('Failed to fetch logs');
  }

  const json = await res.json();
  // Filter out empty responses that can come from Firestore REST API
  return json.filter((item: any) => item.document).map((item: any) => {
    const fields = item.document.fields;
    return {
      employeeName: fields.employeeName.stringValue,
      itemName: fields.itemName.stringValue,
      dateTimeLogged: fields.dateTimeLogged.timestampValue,
    };
  });
}
