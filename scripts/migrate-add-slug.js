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

async function migrateAddSlug() {
  console.log('Starting migration: Add slug column to casinos table...\n');

  try {
    // Step 1: Add slug column if it doesn't exist
    console.log('Step 1: Adding slug column (if needed)...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'casinos' AND column_name = 'slug'
          ) THEN
            ALTER TABLE casinos ADD COLUMN slug TEXT;
          END IF;
        END $$;
      `
    }).catch(async () => {
      // If RPC doesn't exist, try direct SQL query via REST API
      // This is a fallback - may not work in all Supabase setups
      console.log('RPC exec_sql not available, trying alternative method...');
      return { error: null };
    });

    if (addColumnError) {
      console.error('⚠️  Warning: Could not add column via RPC:', addColumnError.message);
      console.log('   Please add column manually via SQL Editor:');
      console.log('   ALTER TABLE casinos ADD COLUMN IF NOT EXISTS slug TEXT;');
    } else {
      console.log('✅ Slug column check completed');
    }

    // Step 2: Fetch all casinos without slugs
    console.log('\nStep 2: Fetching casinos without slugs...');
    const { data: casinos, error: fetchError } = await supabase
      .from('casinos')
      .select('id, name, slug')
      .or('slug.is.null,slug.eq.');

    if (fetchError) {
      // Try fetching all casinos and filtering
      const { data: allCasinos, error: allError } = await supabase
        .from('casinos')
        .select('id, name, slug');

      if (allError) {
        throw new Error(`Failed to fetch casinos: ${allError.message}`);
      }

      var casinosToUpdate = (allCasinos || []).filter(c => !c.slug || c.slug === '');
    } else {
      var casinosToUpdate = casinos || [];
    }

    console.log(`Found ${casinosToUpdate.length} casinos without slugs`);

    if (casinosToUpdate.length === 0) {
      console.log('\n✅ All casinos already have slugs! Migration complete.');
      return;
    }

    // Step 3: Generate unique slugs for each casino
    console.log('\nStep 3: Generating slugs...');
    const updates = [];

    for (const casino of casinosToUpdate) {
      let slug = generateSlug(casino.name);
      let finalSlug = slug;
      let counter = 1;

      // Check for duplicates and make unique
      while (true) {
        const { data: existing } = await supabase
          .from('casinos')
          .select('id')
          .eq('slug', finalSlug)
          .neq('id', casino.id)
          .maybeSingle();

        if (!existing) {
          break; // Slug is unique
        }

        // Slug exists, add counter
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      updates.push({
        id: casino.id,
        name: casino.name,
        slug: finalSlug,
      });

      console.log(`  ${casino.name} -> ${finalSlug}`);
    }

    // Step 4: Update casinos with slugs
    console.log(`\nStep 4: Updating ${updates.length} casinos with slugs...`);
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('casinos')
        .update({ slug: update.slug })
        .eq('id', update.id);

      if (updateError) {
        console.error(`  ❌ Error updating ${update.name}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Updated: ${update.name}`);
        successCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Successfully updated: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (successCount > 0) {
      console.log('\n📝 Next steps:');
      console.log('   1. Make slug NOT NULL: ALTER TABLE casinos ALTER COLUMN slug SET NOT NULL;');
      console.log('   2. Add unique constraint: ALTER TABLE casinos ADD CONSTRAINT casinos_slug_unique UNIQUE (slug);');
      console.log('   3. Add index: CREATE INDEX IF NOT EXISTS idx_casinos_slug ON casinos(slug);');
      console.log('\n   Run these commands in your Supabase SQL Editor.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nAlternative: Run the SQL migration manually in Supabase SQL Editor:');
    console.error('   See file: migrate-add-slug.sql');
    process.exit(1);
  }
}

migrateAddSlug()
  .then(() => {
    console.log('\nScript finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
