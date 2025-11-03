import { AdminPanel } from "@/components/admin-panel";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/auth");
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile?.is_admin) {
      redirect("/");
    }

    return <AdminPanel />;
  } catch (error) {
    console.error("Admin page error:", error);
    redirect("/auth");
  }
}
