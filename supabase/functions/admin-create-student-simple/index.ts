
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
    console.log('Creating student account...')

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

    // Verify admin/teacher privileges using session token
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

    if (!['admin', 'teacher'].includes(sessionData.users.role)) {
      console.error('User is not admin/teacher:', sessionData.users.role)
      return new Response(
        JSON.stringify({ error: '관리자 또는 선생님 권한이 필요합니다.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { username, full_name, date_of_birth, gender, school, grade, system_type } = await req.json()

    if (!username || username.trim() === '') {
      return new Response(
        JSON.stringify({ error: '아이디는 필수입니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!full_name || full_name.trim() === '') {
      return new Response(
        JSON.stringify({ error: '이름은 필수입니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!date_of_birth) {
      return new Response(
        JSON.stringify({ error: '생년월일은 필수입니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return new Response(
        JSON.stringify({ error: '성별은 필수입니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (system_type && !['korea', 'us', 'uk'].includes(system_type)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 교육 시스템입니다.' }),
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
        full_name: full_name.trim(),
        role: 'student',
        date_of_birth: date_of_birth,
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

    // Create student profile
    const { error: profileError } = await supabase
      .from('student_profiles')
      .insert({
        user_id: newUser.id,
        gender,
        school: school?.trim() || null,
        grade: grade?.trim() || null,
        system_type: system_type || null
      })

    if (profileError) {
      console.error('Error creating student profile:', profileError)
      // Clean up user if profile creation fails
      await supabase.from('users').delete().eq('id', newUser.id)
      return new Response(
        JSON.stringify({ error: '학생 프로필 생성에 실패했습니다.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Student account created successfully:', newUser.id)

    return new Response(
      JSON.stringify({
        username: newUser.username,
        temp_password: tempPassword,
        full_name: newUser.full_name,
        gender,
        school: school || null,
        grade: grade || null,
        system_type
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
