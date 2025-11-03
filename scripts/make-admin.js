const { createClient } = require('@supabase/supabase-js');

// Try to load dotenv if available
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

const email = 'seosasha@gmail.com';

async function makeAdmin() {
  console.log(`Making ${email} an administrator...\n`);

  try {
    // First, check if user profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking user profile:', profileError.message);
      process.exit(1);
    }

    if (existingProfile) {
      // User profile exists, update it
      console.log(`✅ Found user profile: ${existingProfile.email} (ID: ${existingProfile.id})`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('email', email);

      if (updateError) {
        console.error('Error updating user profile:', updateError.message);
        process.exit(1);
      }
      console.log('✅ User profile updated with admin privileges');
    } else {
      // User profile doesn't exist, need to find user in auth.users
      // We'll use a direct SQL query through RPC or update via email
      console.log('⚠️  User profile not found. Attempting to find user in auth.users...');
      
      // Try to update using SQL directly (if user exists in auth.users)
      // This requires the user to have signed up first
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE public.users
          SET is_admin = TRUE
          WHERE email = '${email}';
          
          INSERT INTO public.users (id, email, name, is_admin)
          SELECT 
            id,
            email,
            COALESCE(raw_user_meta_data->>'full_name', email),
            TRUE
          FROM auth.users
          WHERE email = '${email}'
            AND NOT EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.users.id)
          ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;
        `
      });

      if (sqlError) {
        console.error(`❌ User with email "${email}" not found in database.`);
        console.error('Please make sure the user has signed up first.');
        console.error('Error:', sqlError.message);
        console.error('\n💡 Alternative: Run the SQL script from make-admin.sql in Supabase SQL Editor');
        process.exit(1);
      }
      console.log('✅ User profile created/updated with admin privileges');
    }

    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (verifyError) {
      console.error('Error verifying update:', verifyError.message);
      process.exit(1);
    }

    console.log('\n✅ Success! User is now an administrator:');
    console.log(`   Email: ${updatedProfile.email}`);
    console.log(`   Name: ${updatedProfile.name || 'N/A'}`);
    console.log(`   Admin: ${updatedProfile.is_admin}`);
    console.log(`   ID: ${updatedProfile.id}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

makeAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
