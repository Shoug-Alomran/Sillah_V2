import { db } from '../db';

// Get all events
export async function getAllEvents() {
  return await db.all('SELECT * FROM events ORDER BY date ASC');
}

// Get upcoming events
export async function getUpcomingEvents() {
  return await db.all(
    'SELECT * FROM events WHERE date >= date("now") ORDER BY date ASC'
  );
}

// Add a new event
export async function addEvent({ title, date, location, description }) {
  return await db.run(
    'INSERT INTO events (title, date, location, description) VALUES (?, ?, ?, ?)',
    [title, date, location, description]
  );
}