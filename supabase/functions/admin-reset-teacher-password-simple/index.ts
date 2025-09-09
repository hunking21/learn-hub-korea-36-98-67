
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
    console.log('Admin resetting teacher password...')

    // Get session token from header
    const sessionToken = req.headers.get('x-session-token')
    if (!sessionToken) {
      console.error('No session token provided')
      return new Response(
        JSON.stringify({ error: '인증 토큰이 없습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin privileges
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (sessionData.users.role !== 'admin') {
      console.error('User is not admin:', sessionData.users.role)
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse body
    const { username } = await req.json()
    if (!username || username.trim() === '') {
      return new Response(
        JSON.stringify({ error: '아이디는 필수입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Lookup user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, full_name, role, is_active')
      .eq('username', username.trim())
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: '해당 아이디의 사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (userData.role !== 'teacher') {
      return new Response(
        JSON.stringify({ error: '선생님 계정만 초기화할 수 있습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (userData.is_active === false) {
      return new Response(
        JSON.stringify({ error: '비활성화된 계정입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Reset password to 0000
    const tempPassword = '0000'

    // Hash with bcryptjs
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(tempPassword, salt)

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        requires_password_change: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.id)

    if (updateError) {
      console.error('Password reset update error:', updateError)
      return new Response(
        JSON.stringify({ error: '비밀번호 초기화에 실패했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Password reset done for user:', userData.id)

    return new Response(
      JSON.stringify({
        username: userData.username,
        temp_password: tempPassword,
        full_name: userData.full_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in password reset:', error)
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
