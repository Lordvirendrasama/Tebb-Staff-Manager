
'use server';

import { getEmployees, addEmployee } from '@/services/attendance-service';
import { setDoc, doc } from 'firebase/firestore';
import { db } from './firebase-client';


const DEFAULT_EMPLOYEES = [
  { name: 'Mario', weeklyOffDay: 'Tuesday', standardWorkHours: 8 },
  { name: 'Luigi', weeklyOffDay: 'Wednesday', standardWorkHours: 8 },
  { name: 'Peach', weeklyOffDay: 'Thursday', standardWorkHours: 6 },
];

async function setEmployeeOfTheWeek(employeeName: string | null): Promise<void> {
    await setDoc(doc(db, 'awards', 'employeeOfTheWeek'), { employeeName });
}

export const seedDatabase = async () => {
    console.log('Seeding database...');
    const employees = await getEmployees();
    
    if (employees.length === 0) {
        console.log('No employees found. Seeding default employees...');
        for (const emp of DEFAULT_EMPLOYEES) {
            await addEmployee(emp);
        }
        console.log('Default employees seeded.');

        await setEmployeeOfTheWeek(DEFAULT_EMPLOYEES[0].name);
        console.log('Default employee of the week set.');
    } else {
        console.log('Employees already exist. Skipping seeding.');
    }
    console.log('Database seeding process complete.');
};
