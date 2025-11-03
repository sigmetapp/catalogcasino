import { createSupabaseClient } from './supabase';

export async function getCurrentUser() {
  const supabase = createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  
  const profile = await getUserProfile(userId);
  return profile?.is_admin ?? false;
}
