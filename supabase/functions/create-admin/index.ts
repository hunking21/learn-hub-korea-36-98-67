import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create admin user account using service role
    const { data: adminUser, error: createUserError } = await supabaseServiceRole.auth.admin.createUser({
      email: 'admin@tnacademy.com',
      password: 'admin123!',
      email_confirm: true,
      user_metadata: {
        display_name: 'TN Academy 관리자',
        full_name: 'TN Academy 관리자'
      }
    });

    if (createUserError) {
      console.error('Error creating admin user:', createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile with admin role
    const { error: profileError } = await supabaseServiceRole
      .from('profiles')
      .upsert({
        user_id: adminUser.user.id,
        email: 'admin@tnacademy.com',
        display_name: 'TN Academy 관리자',
        role: 'admin'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create admin profile' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add admin role
    const { error: roleInsertError } = await supabaseServiceRole
      .from('user_roles')
      .upsert({
        user_id: adminUser.user.id,
        role: 'admin'
      });

    if (roleInsertError) {
      console.error('Error inserting admin role:', roleInsertError);
    }

    console.log('Successfully created admin account');

    return new Response(
      JSON.stringify({
        message: 'Admin account created successfully',
        email: 'admin@tnacademy.com',
        password: 'admin123!'
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