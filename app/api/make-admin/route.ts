import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header with a secret token
    const authHeader = request.headers.get('authorization');
    const secretToken = process.env.ADMIN_SECRET_TOKEN || process.env.SEED_SECRET_TOKEN;
    
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

    const body = await request.json();
    const email = body.email || 'seosasha@gmail.com';

    const supabase = createSupabaseAdminClient();

    // First, try to find the user in auth.users
    // We need to query users table and find by email
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (usersError) {
      // If user doesn't exist in users table, try to get from auth
      // For admin operations, we might need to use SQL directly
      // Let's try a different approach - update via SQL
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        query: `
          UPDATE public.users
          SET is_admin = TRUE
          WHERE email = $1;
          
          INSERT INTO public.users (id, email, name, is_admin)
          SELECT 
            id,
            email,
            COALESCE(raw_user_meta_data->>'full_name', email),
            TRUE
          FROM auth.users
          WHERE email = $1
            AND NOT EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.users.id)
          ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;
        `,
        params: [email]
      });

      if (sqlError) {
        // Fallback: direct update using service role
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_admin: true })
          .eq('email', email);

        if (updateError) {
          return NextResponse.json(
            {
              success: false,
              error: `Failed to update user: ${updateError.message}. User with email ${email} may not exist. Please make sure the user has signed up first.`,
            },
            { status: 400 }
          );
        }
      }
    } else if (users && users.length > 0) {
      // User exists, update their admin status
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('email', email);

      if (updateError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to update user: ${updateError.message}`,
          },
          { status: 400 }
        );
      }
    } else {
      // User doesn't exist in users table yet
      // We need to create the profile, but we need the user ID from auth.users
      // This requires direct SQL or the user needs to sign up first
      return NextResponse.json(
        {
          success: false,
          error: `User with email ${email} not found. Please make sure the user has signed up first, then try again.`,
        },
        { status: 404 }
      );
    }

    // Verify the update
    const { data: updatedUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, name, is_admin, created_at')
      .eq('email', email)
      .single();

    if (verifyError) {
      return NextResponse.json(
        {
          success: false,
          error: `Update completed but verification failed: ${verifyError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} is now an administrator`,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to make user an administrator',
      },
      { status: 500 }
    );
  }
}

// GET method to check admin status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || 'seosasha@gmail.com';

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error: 'Missing required environment variables',
        },
        { status: 500 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, is_admin, created_at')
      .eq('email', email)
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: `User not found: ${error.message}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      isAdmin: user.is_admin,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to check admin status',
      },
      { status: 500 }
    );
  }
}
