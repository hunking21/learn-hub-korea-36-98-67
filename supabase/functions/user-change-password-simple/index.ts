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
    console.log('User changing password...')

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

    // Get user from session
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        expires_at,
        users!inner(id, username, password_hash, role)
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

    // Parse body
    const { current_password, new_password } = await req.json()
    
    if (!current_password || !new_password) {
      return new Response(
        JSON.stringify({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new_password.length < 4) {
      return new Response(
        JSON.stringify({ error: '새 비밀번호는 최소 4자 이상이어야 합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = bcrypt.compareSync(current_password, sessionData.users.password_hash)
    if (!isCurrentPasswordValid) {
      return new Response(
        JSON.stringify({ error: '현재 비밀번호가 올바르지 않습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash new password
    const salt = bcrypt.genSaltSync(10)
    const hashedNewPassword = bcrypt.hashSync(new_password, salt)

    // Update password and clear requires_password_change flag
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedNewPassword,
        requires_password_change: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionData.user_id)

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({ error: '비밀번호 변경에 실패했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Password changed successfully for user:', sessionData.user_id)

    return new Response(
      JSON.stringify({ message: '비밀번호가 성공적으로 변경되었습니다.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in password change:', error)
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})