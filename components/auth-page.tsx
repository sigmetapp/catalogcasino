"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (user || !mounted) {
    return null;
  }

  const redirectUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
          Sign In
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-200 mb-4 sm:mb-6 text-center">
          Sign in with Google to leave reviews and rate casinos
        </p>
        <Auth
          supabaseClient={supabase}
          providers={["google"]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#2563eb",
                  brandAccent: "#1d4ed8",
                },
              },
            },
          }}
          theme="default"
          redirectTo={`${redirectUrl}/`}
        />
      </div>
    </div>
  );
}
