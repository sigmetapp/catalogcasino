import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

const demoCasinos = [
  {
    name: 'Royal Vegas Casino',
    logo_url: 'https://via.placeholder.com/150?text=Royal+Vegas',
    bonus: 'Welcome Bonus: $500 + 100 Free Spins',
    license: 'Malta Gaming Authority',
    description: 'Royal Vegas Casino offers a premium gaming experience with over 500 slot games, live dealer tables, and a comprehensive loyalty program. Established in 2000, it has become one of the most trusted online casinos in the industry.',
    country: 'Malta',
    payment_methods: ['Visa', 'Mastercard', 'PayPal', 'Skrill', 'Neteller', 'Bitcoin'],
    rating_avg: 4.5,
    rating_count: 234,
  },
  {
    name: 'Betway Casino',
    logo_url: 'https://via.placeholder.com/150?text=Betway',
    bonus: '100% Match Bonus up to $1,000',
    license: 'UK Gambling Commission',
    description: 'Betway Casino is a leading online casino platform known for its extensive game library, fast payouts, and excellent customer support. The casino features games from top providers and offers a mobile-optimized experience.',
    country: 'United Kingdom',
    payment_methods: ['Visa', 'Mastercard', 'PayPal', 'Bank Transfer', 'Ethereum'],
    rating_avg: 4.7,
    rating_count: 189,
  },
  {
    name: 'LeoVegas Casino',
    logo_url: 'https://via.placeholder.com/150?text=LeoVegas',
    bonus: 'Up to $1,200 + 120 Free Spins',
    license: 'Malta Gaming Authority',
    description: 'LeoVegas is the "King of Mobile Casino" with an award-winning mobile platform. It offers a wide selection of slots, table games, and live casino options. The casino is known for its quick withdrawals and 24/7 customer service.',
    country: 'Sweden',
    payment_methods: ['Visa', 'Mastercard', 'PayPal', 'Trustly', 'Zimpler'],
    rating_avg: 4.6,
    rating_count: 312,
  },
  {
    name: '888 Casino',
    logo_url: 'https://via.placeholder.com/150?text=888+Casino',
    bonus: 'New Player Package: $400 + 88 Free Spins',
    license: 'UK Gambling Commission',
    description: '888 Casino is one of the oldest and most respected online casinos, operating since 1997. It offers a diverse range of games including exclusive titles, live dealer games, and a comprehensive sportsbook. The platform is available in multiple languages.',
    country: 'United Kingdom',
    payment_methods: ['Visa', 'Mastercard', 'PayPal', 'Skrill', 'Neteller', 'Apple Pay'],
    rating_avg: 4.4,
    rating_count: 278,
  },
  {
    name: 'Casumo Casino',
    logo_url: 'https://via.placeholder.com/150?text=Casumo',
    bonus: 'Welcome Bonus: $1,200 + 200 Free Spins',
    license: 'Malta Gaming Authority',
    description: 'Casumo is an innovative casino platform that gamifies the online casino experience. Players earn rewards and level up while playing. The casino features a unique design, fast payments, and a vast selection of games from top providers.',
    country: 'Malta',
    payment_methods: ['Visa', 'Mastercard', 'PayPal', 'Skrill', 'Trustly', 'Bitcoin'],
    rating_avg: 4.8,
    rating_count: 156,
  },
];

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header with a secret token
    const authHeader = request.headers.get('authorization');
    const secretToken = process.env.SEED_SECRET_TOKEN;
    
    // If secret token is set, require it for security
    if (secretToken && authHeader !== `Bearer ${secretToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide a valid authorization token.' },
        { status: 401 }
      );
    }

    // Check if required environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
        },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const results = [];

    for (const casino of demoCasinos) {
      try {
        // Check if casino already exists
        const { data: existing } = await supabase
          .from('casinos')
          .select('id, name')
          .eq('name', casino.name)
          .single();

        if (existing) {
          results.push({
            name: casino.name,
            status: 'skipped',
            message: 'Already exists',
          });
          continue;
        }

        // Insert casino
        const { data, error } = await supabase
          .from('casinos')
          .insert(casino)
          .select()
          .single();

        if (error) {
          results.push({
            name: casino.name,
            status: 'error',
            message: error.message,
          });
          continue;
        }

        results.push({
          name: casino.name,
          status: 'success',
          message: 'Added successfully',
        });
      } catch (error: any) {
        results.push({
          name: casino.name,
          status: 'error',
          message: error.message || 'Unexpected error',
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const skippedCount = results.filter((r) => r.status === 'skipped').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `Seeding completed: ${successCount} added, ${skippedCount} skipped, ${errorCount} errors`,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed database',
      },
      { status: 500 }
    );
  }
}

// GET method to check if seeding is needed
export async function GET() {
  try {
    // Check if required environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error: 'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
        },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from('casinos')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({
      casinoCount: count || 0,
      needsSeeding: (count || 0) === 0,
      message: (count || 0) === 0 
        ? 'Database is empty. Use POST /api/seed to add demo data.'
        : `Database has ${count} casino(s).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to check database status',
      },
      { status: 500 }
    );
  }
}
