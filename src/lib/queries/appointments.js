import { db } from '../db';

// Get all appointments
export async function getAllAppointments() {
  return await db.all('SELECT * FROM appointments ORDER BY date ASC');
}

// Get upcoming appointments
export async function getUpcomingAppointments() {
  return await db.all('SELECT * FROM appointments WHERE date >= date("now") ORDER BY date ASC');
}

// Get past appointments
export async function getPastAppointments() {
  return await db.all('SELECT * FROM appointments WHERE date < date("now") ORDER BY date DESC');
}

// Add a new appointment
export async function addAppointment({ title, date, location }) {
  return await db.run(
    'INSERT INTO appointments (title, date, location) VALUES (?, ?, ?)',
    [title, date, location]
  );
}