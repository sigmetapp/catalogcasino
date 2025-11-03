import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export async function GET() {
  const health = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      error: null as string | null,
      tables: {
        casinos: { exists: false, count: 0 },
        reviews: { exists: false, count: 0 },
        users: { exists: false, count: 0 },
      },
    },
    environment: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      health.status = 'error';
      health.database.error = 'Missing environment variables';
      return NextResponse.json(health, { status: 503 });
    }

    // Try to connect to Supabase
    const supabase = createSupabaseAdminClient();

    // Test connection by checking casinos table
    const { count: casinosCount, error: casinosError } = await supabase
      .from('casinos')
      .select('*', { count: 'exact', head: true });

    if (casinosError) {
      // Check if table doesn't exist
      if (casinosError.code === '42P01' || casinosError.message.includes('does not exist')) {
        health.status = 'warning';
        health.database.error = 'Database tables not initialized. Run seed-demo-casinos.sql in Supabase SQL Editor.';
        health.database.tables.casinos.exists = false;
      } else {
        health.status = 'error';
        health.database.error = casinosError.message;
      }
      return NextResponse.json(health, { status: 503 });
    }

    // Connection successful
    health.status = 'ok';
    health.database.connected = true;
    health.database.tables.casinos.exists = true;
    health.database.tables.casinos.count = casinosCount || 0;

    // Check reviews table
    const { count: reviewsCount, error: reviewsError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    if (!reviewsError) {
      health.database.tables.reviews.exists = true;
      health.database.tables.reviews.count = reviewsCount || 0;
    }

    // Check users table
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (!usersError) {
      health.database.tables.users.exists = true;
      health.database.tables.users.count = usersCount || 0;
    }

    return NextResponse.json(health, { status: 200 });
  } catch (error: any) {
    health.status = 'error';
    health.database.error = error.message || 'Unknown error';
    return NextResponse.json(health, { status: 503 });
  }
}
