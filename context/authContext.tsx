// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
};

type AuthContextType = {
  user: User | null;
  jwt: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    meta?: Record<string, any>
  ) => Promise<void>;
  logout: () => Promise<void>;
  getJwt: () => string | null;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const supabase = createBrowserClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("sc_access_token")
      : null
  );
  const [loading, setLoading] = useState(true);

  // helper to check user's role from your `users` table in Supabase
  const checkAndRedirectRole = async (userId: string | undefined | null) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!error && data?.role === "ADMIN") {
        router.replace("/admin"); // send admins to admin page
      } else {
        // Non-admin: go to homepage (or previous location)
        router.replace("/");
      }
    } catch (err) {
      console.error("role check error", err);
      router.replace("/");
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const { data: userData } = await supabase.auth.getUser();

        if (session && userData?.user) {
          if (!mounted) return;
          const u = userData.user;
          setUser({
            id: u.id,
            email: u.email,
            user_metadata: u.user_metadata ?? null,
          });
          setJwt(session.access_token);
          localStorage.setItem("sc_access_token", session.access_token);

       
          await checkAndRedirectRole(u.id);
        } else {
          setUser(null);
          setJwt(null);
          localStorage.removeItem("sc_access_token");
        }
      } catch (err) {
        console.error("Auth init error", err);
        setUser(null);
        setJwt(null);
        localStorage.removeItem("sc_access_token");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, _session) => {
        // update token
        supabase.auth.getSession().then(({ data }) => {
          const s = data?.session;
          if (s?.access_token) {
            setJwt(s.access_token);
            localStorage.setItem("sc_access_token", s.access_token);
          } else {
            setJwt(null);
            localStorage.removeItem("sc_access_token");
          }
        });

        // update user object and redirect if admin
        supabase.auth.getUser().then(async (res) => {
          const u = res.data.user;
          if (u) {
            setUser({
              id: u.id,
              email: u.email,
              user_metadata: u.user_metadata ?? null,
            });
            // check role & redirect if admin
            await checkAndRedirectRole(u.id);
          } else {
            setUser(null);
          }
        });
      }
    );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }
      if (data?.session) {
        setJwt(data.session.access_token);
        localStorage.setItem("sc_access_token", data.session.access_token);
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata ?? null,
        });

        // After login, check role and redirect:
        await checkAndRedirectRole(data.user.id);
        toast.success("Logged in successfully!");
      } else {
        toast.info("Check your email to confirm your account");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Login error");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    meta?: Record<string, any>
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: meta ?? {} },
      });
      if (error) {
        toast.error(error.message || "Signup failed");
        return;
      }

      if (data?.user && data?.session) {
        // create "users" row server-side (you already do this in your flow)
        const res = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            username: data.user.user_metadata?.username,
            firstName: data.user.user_metadata?.firstName,
            lastName: data.user.user_metadata?.lastName,
          }),
        });

        setUser({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata ?? null,
        });
        setJwt(data.session.access_token);
        localStorage.setItem("sc_access_token", data.session.access_token);
        toast.success("Signed up and logged in");
        // if admin, redirect (rare for signup flow)
        await checkAndRedirectRole(data.user.id);
      } else {
        toast.success("Account created. Check your email to confirm.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Signup error");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setJwt(null);
      localStorage.removeItem("sc_access_token");
      toast.success("Logged out successfully");
      router.replace("/auth");
    } catch (err) {
      console.error(err);
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const getJwt = () => jwt;

  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = getJwt();
    const headers = new Headers(init?.headers as HeadersInit | undefined);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const newInit = { ...init, headers };
    return fetch(input, newInit);
  };

  return (
    <AuthContext.Provider
      value={{ user, jwt, loading, login, signup, logout, getJwt, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
};
