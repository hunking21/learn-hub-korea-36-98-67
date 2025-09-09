import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get session token from request headers
    const sessionToken = req.headers.get('x-session-token');
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Missing session token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Validating session token...')

    // Validate session token and get user info
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, role, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !sessionData) {
      console.error('Invalid session token:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    if (sessionData.role !== 'admin') {
      console.error('Unauthorized: User is not admin')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { student_id, full_name, date_of_birth, gender, school, grade, system_type, private_note } = await req.json()

    console.log('Updating student account...')

    // Update user information including profile data
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        full_name,
        date_of_birth,
        gender,
        school,
        grade,
        system_type,
        private_note,
        updated_at: new Date().toISOString()
      })
      .eq('id', student_id)

    if (userUpdateError) {
      console.error('Error updating user:', userUpdateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user information' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Student account updated successfully: ${student_id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Student information updated successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in admin-update-student function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})