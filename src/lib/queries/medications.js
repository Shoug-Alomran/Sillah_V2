import { db } from '../db';

// Get all medications
export async function getAllMedications() {
  return await db.all('SELECT * FROM medications ORDER BY name ASC');
}

// Get active medications (those currently being taken)
export async function getActiveMedications() {
  return await db.all(
    'SELECT * FROM medications WHERE active = 1 ORDER BY name ASC'
  );
}

// Add a new medication
export async function addMedication({ name, dosage, frequency, start_date, active }) {
  return await db.run(
    'INSERT INTO medications (name, dosage, frequency, start_date, active) VALUES (?, ?, ?, ?, ?)',
    [name, dosage, frequency, start_date, active ? 1 : 0]
  );
}
