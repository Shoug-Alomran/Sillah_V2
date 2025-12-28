import { db } from '../db';

// Get all family members
export async function getAllFamilyMembers() {
  return await db.all('SELECT * FROM family');
}

// Get one member by ID
export async function getFamilyMemberById(id) {
  return await db.get('SELECT * FROM family WHERE id = ?', [id]);
}

// Add a new member
export async function addFamilyMember({ name, relationship, age, health }) {
  return await db.run(
    'INSERT INTO family (name, relationship, age, health) VALUES (?, ?, ?, ?)',
    [name, relationship, age, health]
  );
}
