import { AdminPanel } from "@/components/admin-panel";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userProfile?.is_admin) {
    redirect("/");
  }

  return <AdminPanel />;
}
