
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import bcrypt from 'https://esm.sh/bcryptjs@3.0.2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Creating teacher account without email...')

    // Get session token from header
    const sessionToken = req.headers.get('x-session-token')
    if (!sessionToken) {
      console.error('No session token provided')
      return new Response(
        JSON.stringify({ error: '인증 토큰이 없습니다.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin privileges using session token
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        expires_at,
        users!inner(role)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !sessionData) {
      console.error('Invalid session:', sessionError)
      return new Response(
        JSON.stringify({ error: '유효하지 않은 세션입니다.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (sessionData.users.role !== 'admin') {
      console.error('User is not admin:', sessionData.users.role)
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { username, full_name } = await req.json()

    if (!username || username.trim() === '') {
      return new Response(
        JSON.stringify({ error: '아이디는 필수입니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: '이미 존재하는 아이디입니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Set default password to 0000
    const tempPassword = '0000'
    
    // Hash password using bcryptjs
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(tempPassword, salt)

    // Create user in database
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: username.trim(),
        password_hash: hashedPassword,
        full_name: (full_name?.trim() || username.trim()),
        role: 'teacher',
        requires_password_change: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: '계정 생성에 실패했습니다.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Teacher account created successfully:', newUser.id)

    return new Response(
      JSON.stringify({
        username: newUser.username,
        temp_password: tempPassword,
        full_name: newUser.full_name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
