import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AuthTest() {
  const { user, profile, signIn, signOut, signUp, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        await signUp(username, password, fullName, birthDate);
      } else {
        await signIn(username, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>인증 성공!</CardTitle>
            <CardDescription>커스텀 인증 시스템이 정상 작동합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p><strong>사용자 ID:</strong> {user.id}</p>
              <p><strong>아이디:</strong> {user.username}</p>
              <p><strong>이름:</strong> {profile.display_name}</p>
              <p><strong>역할:</strong> {profile.role}</p>
              <p><strong>가입일:</strong> {new Date(profile.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
            <Button onClick={signOut} className="w-full">
              로그아웃
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? '회원가입' : '로그인'}</CardTitle>
          <CardDescription>
            커스텀 인증 시스템 테스트
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {isSignUp && (
                <>
                  <Input
                    placeholder="이름"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <Input
                    type="date"
                    placeholder="생년월일"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full">
              {isSignUp ? '회원가입' : '로그인'}
            </Button>
            
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full"
            >
              {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 회원가입'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">테스트 계정:</h4>
            <div className="text-sm space-y-1">
              <p><strong>관리자:</strong> admin / admin123!</p>
              <p><strong>선생님:</strong> teacher / teacher123!</p>
              <p><strong>학생:</strong> student / student123!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}