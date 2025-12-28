import { db } from '../db';

// Get all alerts
export async function getAllAlerts() {
  return await db.all('SELECT * FROM alerts ORDER BY severity DESC');
}

// Get alerts by severity
export async function getAlertsBySeverity(severity) {
  return await db.all(
    'SELECT * FROM alerts WHERE severity = ? ORDER BY id DESC',
    [severity]
  );
}

// Add a new alert
export async function addAlert({ title, description, severity }) {
  return await db.run(
    'INSERT INTO alerts (title, description, severity) VALUES (?, ?, ?)',
    [title, description, severity]
  );
}