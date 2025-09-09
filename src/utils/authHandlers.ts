import { AUTH_MODE } from '@/config/authMode';
import { supabase } from '@/integrations/supabase/client';
import { userStore } from '@/store/userStore';

export async function handleLoginSubmit(username: string, password: string, navigate: (p:string)=>void) {
  if (AUTH_MODE === 'mock') {
    // 메모리 기반 사용자 인증
    const user = userStore.authenticate(username, password);
    
    if (!user) {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 세션 저장
    localStorage.setItem('mock_session', JSON.stringify({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role.toLowerCase(), // 'admin' | 'teacher' | 'student'
      permissions: user.permissions,
      issuedAt: Date.now()
    }));

    // 역할별 화면 이동
    const role = user.role.toLowerCase();
    if (role === 'admin') return navigate('/admin');
    if (role === 'teacher') return navigate('/teacher');
    return navigate('/student');
  }

  // Supabase RPC 로그인 로직
  try {
    const { data, error } = await supabase.rpc('verify_user_login', {
      p_username: username,
      p_password: password,
    });

    if (error) throw new Error(error.message);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const { token } = data[0];
    localStorage.setItem('session_token', token);
    
    // 프로필 정보 가져오기
    const { data: profileData, error: profileError } = await supabase.rpc('get_my_profile', { 
      _session_token: token 
    });

    if (profileError) throw new Error(profileError.message);
    if (!Array.isArray(profileData) || profileData.length === 0) {
      throw new Error('세션이 만료되었거나 유효하지 않습니다.');
    }

    const { role } = profileData[0];
    
    // 역할별 화면 이동
    if (role === 'admin') return navigate('/admin');
    if (role === 'teacher') return navigate('/teacher');
    return navigate('/student');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.');
  }
}