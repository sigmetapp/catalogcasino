"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Lazy initialization of Supabase client - only when component mounts
  const supabase = useMemo(() => {
    try {
      return createSupabaseClient();
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!supabase) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    refreshUser().finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback for SSR/SSG when provider is not available
    return {
      user: null,
      loading: false,
      refreshUser: async () => {
        // No-op during SSR/SSG
      },
    };
  }
  return context;
}
