const { createClient } = require('@supabase/supabase-js');

// Try to load dotenv if available, but don't fail if it's not installed
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
} catch (e) {
  // dotenv not installed, environment variables should be set manually
}

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

/**
 * Transliterates Cyrillic characters to Latin
 */
function transliterate(text) {
  const cyrillicToLatin = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

/**
 * Generates a URL-friendly slug from a string
 */
function generateSlug(text) {
  // Transliterate Cyrillic to Latin
  let slug = transliterate(text);
  
  // Convert to lowercase
  slug = slug.toLowerCase();
  
  // Replace spaces and special characters with hyphens
  slug = slug.replace(/[^\w\s-]/g, '');
  slug = slug.replace(/\s+/g, '-');
  
  // Remove multiple consecutive hyphens
  slug = slug.replace(/-+/g, '-');
  
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Limit length to 100 characters
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
    slug = slug.replace(/-+$/, '');
  }
  
  return slug || 'casino';
}

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
      // Generate slug from name
      const slug = generateSlug(casino.name);
      
      // Check if casino already exists by slug
      const { data: existing } = await supabase
        .from('casinos')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (existing) {
        console.log(`⚠️  Casino "${casino.name}" (${slug}) already exists, skipping...`);
        continue;
      }

      // Insert casino with slug
      const casinoWithSlug = {
        ...casino,
        slug: slug
      };
      
      const { data, error } = await supabase
        .from('casinos')
        .insert(casinoWithSlug)
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
