
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import SystemSelector from '@/components/test-select/SystemSelector';
import GradeSelector from '@/components/test-select/GradeSelector';

type SystemType = "korea" | "us" | "uk";

export function LoginForm() {
  const { signIn, signUp, checkUsernameAvailable, findUsername, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'auth' | 'forgot-password' | 'find-username'>('auth');
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<'idle' | 'available' | 'taken'>('idle');

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    systemType: null as SystemType | null,
    grade: null as string | null,
  });

  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    username: '',
  });

  const [findUsernameForm, setFindUsernameForm] = useState({
    fullName: '',
    dateOfBirth: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const profile = await signIn(loginForm.username, loginForm.password);
      toast.success('로그인되었습니다.');
      
      console.log('로그인 성공 후 프로필:', profile);
      
      // Wait a bit for state to update, then navigate
      setTimeout(() => {
        console.log('네비게이션 시작:', profile?.role);
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/dashboard');
        }
      }, 100);
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameHandler = async (username: string) => {
    if (username.length < 3) {
      setUsernameCheckStatus('idle');
      return;
    }
    
    try {
      const isAvailable = await checkUsernameAvailable(username);
      setUsernameCheckStatus(isAvailable ? 'available' : 'taken');
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameCheckStatus('idle');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (usernameCheckStatus !== 'available') {
      setError('사용 가능한 아이디를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      await signUp(signupForm.username, signupForm.password, signupForm.fullName, signupForm.dateOfBirth, signupForm.gender, signupForm.systemType, signupForm.grade);
      toast.success('계정이 생성되었습니다.');
    } catch (error: any) {
      setError(error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tempPassword = await resetPassword(forgotPasswordForm.username);
      toast.success(`임시 비밀번호가 발급되었습니다: ${tempPassword}`);
      setCurrentView('auth');
    } catch (error: any) {
      setError(error.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const foundUsername = findUsername(findUsernameForm.fullName, findUsernameForm.dateOfBirth);
      if (foundUsername) {
        toast.success(`아이디를 찾았습니다: ${foundUsername}`);
      } else {
        setError('일치하는 회원 정보를 찾을 수 없습니다.');
      }
      setCurrentView('auth');
    } catch (error: any) {
      setError(error.message || '아이디 찾기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (currentView === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('auth')}
              className="absolute left-0 top-0 flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
              뒤로
            </Button>
            <CardTitle className="text-2xl font-bold text-academy-brown">비밀번호 찾기</CardTitle>
            <CardDescription>
              아이디를 입력하면 임시 비밀번호를 발급해드립니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-username">아이디</Label>
                <Input
                  id="forgot-username"
                  type="text"
                  value={forgotPasswordForm.username}
                  onChange={(e) => setForgotPasswordForm({ ...forgotPasswordForm, username: e.target.value })}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '처리 중...' : '임시 비밀번호 발급'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'find-username') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('auth')}
              className="absolute left-0 top-0 flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
              뒤로
            </Button>
            <CardTitle className="text-2xl font-bold text-academy-brown">아이디 찾기</CardTitle>
            <CardDescription>
              가입 시 입력한 정보로 아이디를 찾아드립니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFindUsername} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="find-name">이름</Label>
                <Input
                  id="find-name"
                  type="text"
                  value={findUsernameForm.fullName}
                  onChange={(e) => setFindUsernameForm({ ...findUsernameForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="find-birth">생년월일</Label>
                <Input
                  id="find-birth"
                  type="date"
                  value={findUsernameForm.dateOfBirth}
                  onChange={(e) => setFindUsernameForm({ ...findUsernameForm, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '검색 중...' : '아이디 찾기'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute left-0 top-0 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Home size={16} />
            홈으로
          </Button>
          <CardTitle className="text-2xl font-bold text-academy-brown">TN Academy</CardTitle>
          <CardDescription>
            학습 관리 시스템에 로그인하거나 계정을 생성하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>테스트 계정 정보:</strong><br />
                  <strong>관리자:</strong> admin / admin123!<br />
                  <strong>선생님:</strong> teacher / teacher123!<br />
                  <strong>학생:</strong> student / student123!
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">아이디</Label>
                  <Input
                    id="username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '로그인 중...' : '로그인'}
                </Button>
                
                <div className="flex justify-between text-sm">
                  <Button 
                    variant="link" 
                    type="button" 
                    onClick={() => setCurrentView('forgot-password')}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  >
                    비밀번호 찾기
                  </Button>
                  <Button 
                    variant="link" 
                    type="button" 
                    onClick={() => setCurrentView('find-username')}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  >
                    아이디 찾기
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>학생 전용 가입입니다.</strong> 선생님 계정은 관리자에게 요청하세요.
                </p>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">아이디</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={signupForm.username}
                    onChange={(e) => {
                      setSignupForm({ ...signupForm, username: e.target.value });
                      checkUsernameHandler(e.target.value);
                    }}
                    placeholder="최소 3자 이상"
                    required
                  />
                  {usernameCheckStatus === 'available' && (
                    <p className="text-sm text-green-600">✓ 사용 가능한 아이디입니다</p>
                  )}
                  {usernameCheckStatus === 'taken' && (
                    <p className="text-sm text-red-600">✗ 이미 사용 중인 아이디입니다</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full-name">이름</Label>
                  <Input
                    id="full-name"
                    type="text"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-of-birth">생년월일</Label>
                  <Input
                    id="date-of-birth"
                    type="date"
                    value={signupForm.dateOfBirth}
                    onChange={(e) => setSignupForm({ ...signupForm, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">성별</Label>
                  <Select value={signupForm.gender} onValueChange={(value) => setSignupForm({ ...signupForm, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="성별을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">교육 시스템 (선택사항)</h4>
                  <SystemSelector
                    selected={signupForm.systemType}
                    onSelect={(system) => setSignupForm({ ...signupForm, systemType: system, grade: null })}
                  />
                </div>

                {signupForm.systemType && (
                  <div className="space-y-4">
                    <GradeSelector
                      system={signupForm.systemType}
                      selected={signupForm.grade}
                      onSelect={(grade) => setSignupForm({ ...signupForm, grade })}
                    />
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '계정 생성 중...' : '계정 생성'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
