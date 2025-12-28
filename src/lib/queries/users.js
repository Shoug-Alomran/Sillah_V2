import { db } from "../db";

// Create a new user
export async function createUser({ full_name, email, passwordHash, role }) {
  return await db.run(
    "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [full_name, email, passwordHash, role]
  );
}

// Get user by email
export async function getUserByEmail(email) {
  return await db.get("SELECT * FROM users WHERE email = ?", [email]);
}

// Verify user credentials
export async function verifyUser(email, passwordHash) {
  return await db.get(
    "SELECT * FROM users WHERE email = ? AND password_hash = ?",
    [email, passwordHash]
  );
}