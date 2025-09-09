import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize regular Supabase client to verify requester's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !hasAdminRole) {
      console.log('Role check failed:', roleError, 'hasAdminRole:', hasAdminRole);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, display_name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate random password
    const temp_password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    // Create user account using service role
    const { data: newUser, error: createUserError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: display_name,
      }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile with teacher role
    const { error: profileError } = await supabaseServiceRole
      .from('profiles')
      .upsert({
        user_id: newUser.user.id,
        email,
        display_name: display_name || email.split('@')[0],
        role: 'teacher'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // If profile creation fails, we should clean up the user
      await supabaseServiceRole.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create teacher profile' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add teacher role
    const { error: roleInsertError } = await supabaseServiceRole
      .from('user_roles')
      .upsert({
        user_id: newUser.user.id,
        role: 'teacher'
      });

    if (roleInsertError) {
      console.error('Error inserting role:', roleInsertError);
      // Continue anyway, as this might be due to unique constraint (role already exists)
    }

    console.log('Successfully created teacher account:', email);

    return new Response(
      JSON.stringify({
        email,
        temp_password,
        display_name: display_name || email.split('@')[0]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});