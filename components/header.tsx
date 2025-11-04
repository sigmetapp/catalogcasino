"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useTheme } from "./theme-provider";
import { Moon, Sun, LogIn, LogOut, User, Shield } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        try {
          const supabase = createSupabaseClient();
          const { data } = await supabase
            .from("users")
            .select("is_admin")
            .eq("id", user.id)
            .single();
          setIsAdmin(data?.is_admin ?? false);
        } catch (error) {
          console.error("Failed to check admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      await refreshUser();
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const handleSignIn = () => {
    router.push("/auth");
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="text-xl sm:text-2xl font-bold hover:opacity-80 transition-opacity">
            🎰 Casino Directory
          </Link>
          
          <nav className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <Link
              href="/"
              className="hover:opacity-80 transition-opacity px-2 sm:px-3 py-2 rounded text-sm sm:text-base"
            >
              Home
            </Link>
            <Link
              href="/sister-sites"
              className="hover:opacity-80 transition-opacity px-2 sm:px-3 py-2 rounded text-sm sm:text-base"
            >
              Sister Sites
            </Link>
            <Link
              href="/review-sites"
              className="hover:opacity-80 transition-opacity px-2 sm:px-3 py-2 rounded text-sm sm:text-base"
            >
              Review Sites
            </Link>
            
            {isAdmin && (
              <Link
                href="/admin"
                className="hover:opacity-80 transition-opacity px-2 sm:px-3 py-2 rounded flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <Shield size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={18} className="sm:w-5 sm:h-5" /> : <Sun size={18} className="sm:w-5 sm:h-5" />}
            </button>
            
            {user ? (
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded bg-white/10 text-xs sm:text-sm">
                  <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="max-w-[100px] sm:max-w-none truncate">{user.email?.split("@")[0]}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-white/20 hover:bg-white/30 transition-colors text-xs sm:text-sm"
                >
                  <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-white/20 hover:bg-white/30 transition-colors text-xs sm:text-sm"
              >
                <LogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">In</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
