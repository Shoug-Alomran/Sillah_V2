import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile from DB
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
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  // Check existing session on first load
  async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  console.log("SESSION:", data);

  const user = data?.session?.user ?? null;

  setCurrentUser(user);

  if (user) {
    await loadProfile(user.id);
  }
}

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Auth state listener will handle setting user + profile
    return data.user;
  }

  /**
   * signup expects:
   * {
   *   email,
   *   password,
   *   fullName,
   *   phoneNumber,
   *   role,
   *   selectedDoctorId
   * }
   */
  async function signup(payload) {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      role,
      selectedDoctorId
    } = payload;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber || null,
          role,
          selected_doctor_id:
            role === "patient" ? selectedDoctorId || null : null
        }
      }
    });

    if (error) throw error;

    // Do NOT manually insert or upsert profile.
    // Database trigger creates it automatically.
    return data.user;
  }

  async function logout() {
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

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setCurrentUser(user);

        if (user) {
          await loadProfile(user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
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
      isDoctor: role === "doctor",
      isPatient: role === "patient"
    };
  }, [currentUser, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}