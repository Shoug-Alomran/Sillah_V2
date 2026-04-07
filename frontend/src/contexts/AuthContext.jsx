import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { api } from "../api";

const AuthContext = createContext(null);
const AUTH_TIMEOUT_MS = 8000;

function withTimeout(promise, label, timeoutMs = AUTH_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out. Please check your connection and try again.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("profiles")
          .select("id,email,full_name,phone_number,role,selected_doctor_id,patient_code,created_at")
          .eq("id", userId)
          .maybeSingle(),
        "Profile loading"
      );

      if (error) {
        console.warn("Profile loading failed:", error.message);
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.warn("Profile loading failed:", error.message);
      setProfile(null);
    }
  }

  async function refreshSession() {
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), "Session restore");
      const user = data?.session?.user ?? null;

      setCurrentUser(user);
      if (user) await loadProfile(user.id);
      else setProfile(null);
    } catch (error) {
      console.warn("Session restore failed:", error.message);
      setCurrentUser(null);
      setProfile(null);
    }
  }

  async function refreshProfile() {
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), "Session refresh");
      const user = data?.session?.user ?? null;
      setCurrentUser(user);
      if (user) await loadProfile(user.id);
      else setProfile(null);
    } catch (error) {
      console.warn("Session refresh failed:", error.message);
      setCurrentUser(null);
      setProfile(null);
    }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  async function signup(payload) {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      role,
      selectedDoctorId,
      selected_doctor_id
    } = payload;
    const selectedDoctor = selected_doctor_id ?? selectedDoctorId ?? null;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber || "",
          role,
          selected_doctor_id: role === "patient" ? selectedDoctor : null
        }
      }
    });

    if (error) throw error;

    let session = data?.session ?? null;

    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) throw signInError;
      session = signInData?.session ?? null;
    }

    const user = session?.user ?? data?.user ?? null;
    if (!user) throw new Error("Could not establish an authenticated session after signup.");

    setCurrentUser(user);

    const profilePayload = {
      id: user.id,
      email,
      full_name: fullName,
      phone_number: phoneNumber || null,
      role,
      selected_doctor_id: role === "patient" ? selectedDoctor : null
    };

    const { error: profileUpsertError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });
    if (profileUpsertError) throw profileUpsertError;

    if (role === "patient" && selectedDoctor) {
      const { error: relationError } = await supabase
        .from("doctor_patient")
        .upsert(
          { doctor_id: selectedDoctor, patient_id: user.id },
          { onConflict: "doctor_id,patient_id", ignoreDuplicates: true }
        );
      if (relationError) throw relationError;
    }

    await loadProfile(user.id);
    return { user, session };
  }

  async function logout() {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
    setCurrentUser(null);
    setProfile(null);
  }

  async function deleteAccount(confirmation) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (!accessToken) throw new Error("Your session has expired. Please log in again.");

    await api("/api/account/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ confirmation }),
    });

    await supabase.auth.signOut();
    setCurrentUser(null);
    setProfile(null);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await refreshSession();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        try {
          await loadProfile(user.id);
        } catch (error) {
          console.warn("Auth profile sync failed:", error.message);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
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
      deleteAccount,
      refreshProfile,
      isDoctor: role === "doctor",
      isPatient: role === "patient",
      isAdmin: role === "admin"
    };
  }, [currentUser, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
