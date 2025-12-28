import { db } from '../db';

// Get all clinics
export async function getAllClinics() {
  return await db.all('SELECT * FROM clinics ORDER BY name ASC');
}

// Get nearby clinics (placeholder logic for now)
export async function getNearbyClinics() {
  return await db.all('SELECT * FROM clinics WHERE nearby = 1 ORDER BY name ASC');
}

// Get top-rated clinics
export async function getTopRatedClinics() {
  return await db.all('SELECT * FROM clinics WHERE rating >= 4.5 ORDER BY rating DESC');
}

// Add a new clinic
export async function addClinic({ name, location, hours, phone, rating, nearby }) {
  return await db.run(
    'INSERT INTO clinics (name, location, hours, phone, rating, nearby) VALUES (?, ?, ?, ?, ?, ?)',
    [name, location, hours, phone, rating, nearby ? 1 : 0]
  );
}