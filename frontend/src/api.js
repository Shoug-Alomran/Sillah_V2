import { supabase } from "./lib/supabaseClient";
// SIGN UP
export async function signup({ email, password, fullName, phone, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role, // "patient" or "doctor"
      },
    },
  });

  if (error) throw error;
  return data;
}

// LOG IN
export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// LOG OUT
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}