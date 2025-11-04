import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Server-side Supabase client
export const createSupabaseServerClient = () => {
  return createServerComponentClient({ cookies });
};

// Alias for compatibility
export const createSupabaseClient = createSupabaseServerClient;
