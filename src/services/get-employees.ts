import type { Employee } from '@/lib/constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export async function getEmployees(): Promise<Employee[]> {
  try {
    const snapshot = await getDocs(collection(db, 'employees'));

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const employee: any = { id: doc.id };
      for(const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
          employee[key] = value.toDate().toISOString();
        } else {
          employee[key] = value;
        }
      }
      return employee as Employee;
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return []; // Return an empty array or handle the error as appropriate
  }
}
