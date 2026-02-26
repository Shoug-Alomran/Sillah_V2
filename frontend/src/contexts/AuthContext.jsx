import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // If profile doesn't exist yet, don't hard-fail the app.
      setProfile(null);
      return;
    }
    setProfile(data);
  }

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user ?? null;
    setCurrentUser(user);
    await loadProfile(user?.id);
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    setCurrentUser(data.user);
    await loadProfile(data.user.id);
    return data.user;
  }

  /**
   * signup expects:
   * {
   *   email, password,
   *   fullName, phoneNumber,
   *   role: "patient" | "doctor",
   *   selectedDoctorId?: string | null
   * }
   */
  async function signup(payload) {
    const { email, password, fullName, phoneNumber, role, selectedDoctorId } = payload;

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;

    const user = data.user;
    setCurrentUser(user);

    // Create/Upsert profile row
    // (Works whether row exists or not)
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
          phone_number: phoneNumber || null,
          role,
          selected_doctor_id: role === "patient" ? (selectedDoctorId || null) : null
        },
        { onConflict: "id" }
      );

    if (upsertError) throw upsertError;

    await loadProfile(user.id);
    return user;
  }

  async function logout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProfile(null);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshSession();
      } finally {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      await loadProfile(user?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => {
    const role = profile?.role;
    return {
      currentUser,
      profile,
      loading,
      login,
      signup,
      logout,
      isDoctor: role === "doctor",
      isPatient: role === "patient"
    };
  }, [currentUser, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}