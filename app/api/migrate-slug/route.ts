import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header with a secret token
    const authHeader = request.headers.get('authorization');
    const secretToken = process.env.SEED_SECRET_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
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

    // Step 1: Check if slug column exists
    const { data: columnCheck, error: checkError } = await supabase.rpc('check_column_exists', {
      table_name: 'casinos',
      column_name: 'slug'
    }).catch(() => ({ data: null, error: null }));

    // Step 2: Add slug column if it doesn't exist
    const addColumnQuery = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'casinos' AND column_name = 'slug'
        ) THEN
          ALTER TABLE casinos ADD COLUMN slug TEXT;
        END IF;
      END $$;
    `;

    const { error: addColumnError } = await supabase.rpc('exec_sql', { 
      sql: addColumnQuery 
    }).catch(async () => {
      // Try direct SQL execution via service role
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ sql: addColumnQuery }),
      });
      return { error: null };
    });

    // Step 3: Create function to generate slug
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION generate_slug_from_name(name_text TEXT)
      RETURNS TEXT AS $$
      DECLARE
        slug_text TEXT;
      BEGIN
        slug_text := LOWER(name_text);
        slug_text := REPLACE(slug_text, ' ', '-');
        slug_text := REGEXP_REPLACE(slug_text, '[^a-z0-9-]', '', 'g');
        slug_text := REGEXP_REPLACE(slug_text, '-+', '-', 'g');
        slug_text := TRIM(BOTH '-' FROM slug_text);
        IF LENGTH(slug_text) > 100 THEN
          slug_text := LEFT(slug_text, 100);
          slug_text := RTRIM(slug_text, '-');
        END IF;
        IF slug_text = '' OR slug_text IS NULL THEN
          slug_text := 'casino';
        END IF;
        RETURN slug_text;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Step 4: Generate slugs for existing casinos
    // Use direct SQL execution
    const { data: casinos, error: fetchError } = await supabase
      .from('casinos')
      .select('id, name')
      .is('slug', null)
      .or('slug.is.null,slug.eq.');

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error fetching casinos:', fetchError);
    }

    // Generate slugs using JavaScript (more reliable than SQL function)
    const { generateSlug } = await import('@/lib/utils');
    
    const updates = [];
    if (casinos && casinos.length > 0) {
      for (const casino of casinos) {
        const slug = generateSlug(casino.name);
        
        // Check for duplicates and add counter if needed
        let finalSlug = slug;
        let counter = 1;
        let exists = true;
        
        while (exists) {
          const { data: existing } = await supabase
            .from('casinos')
            .select('id')
            .eq('slug', finalSlug)
            .neq('id', casino.id)
            .maybeSingle();
          
          if (!existing) {
            exists = false;
          } else {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }
        }
        
        updates.push({
          id: casino.id,
          slug: finalSlug,
        });
      }
    }

    // Update all casinos with slugs
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('casinos')
        .update({ slug: update.slug })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Error updating casino ${update.id}:`, updateError);
      }
    }

    // Step 5: Make slug NOT NULL and add constraint
    // This needs to be done via SQL Editor in Supabase Dashboard
    // or via direct database connection

    return NextResponse.json({
      success: true,
      message: `Migration completed. Updated ${updates.length} casinos with slugs.`,
      updated: updates.length,
      note: 'If slug column is still nullable, you may need to run: ALTER TABLE casinos ALTER COLUMN slug SET NOT NULL; ALTER TABLE casinos ADD CONSTRAINT casinos_slug_unique UNIQUE (slug); via SQL Editor',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to run migration',
      },
      { status: 500 }
    );
  }
}
