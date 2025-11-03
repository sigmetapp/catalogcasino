import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

async function seedDemoCasinos() {
  console.log('Starting to seed demo casinos...\n');

  for (const casino of demoCasinos) {
    try {
      // Check if casino already exists
      const { data: existing } = await supabase
        .from('casinos')
        .select('id, name')
        .eq('name', casino.name)
        .single();

      if (existing) {
        console.log(`⚠️  Casino "${casino.name}" already exists, skipping...`);
        continue;
      }

      // Insert casino
      const { data, error } = await supabase
        .from('casinos')
        .insert(casino)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting "${casino.name}":`, error.message);
        continue;
      }

      console.log(`✅ Successfully added: ${casino.name}`);
    } catch (error) {
      console.error(`❌ Unexpected error for "${casino.name}":`, error);
    }
  }

  console.log('\n✅ Demo casino seeding completed!');
}

seedDemoCasinos()
  .then(() => {
    console.log('\nScript finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
