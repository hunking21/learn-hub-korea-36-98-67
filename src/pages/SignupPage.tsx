import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { userStore } from '@/store/userStore';
import { UserPlus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { generateUsernameFromBirthdate } from '@/utils/usernameGenerator';

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [allowSignup, setAllowSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    system: '',
    grade: '',
    birthdate: undefined as Date | undefined,
    gender: ''
  });

  // Auto-generate username when birthdate changes
  useEffect(() => {
    if (formData.birthdate) {
      try {
        const generatedUsername = generateUsernameFromBirthdate(formData.birthdate);
        setFormData(prev => ({ ...prev, username: generatedUsername }));
      } catch (error) {
        console.error('Username generation error:', error);
      }
    }
  }, [formData.birthdate]);

  useEffect(() => {
    const settings = userStore.getSettings();
    setAllowSignup(settings.allowStudentSelfSignup);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allowSignup) {
      toast({ title: "오류", description: "현재 자가가입이 허용되지 않습니다.", variant: "destructive" });
      return;
    }

    if (!formData.name || !formData.birthdate || !formData.gender) {
      toast({ title: "오류", description: "이름, 생년월일, 성별은 필수입니다.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      userStore.createUser({
        username: formData.username,
        password: '1111', // 자가가입 시에도 기본 비밀번호 사용  
        name: formData.name,
        role: 'STUDENT',
        system: (formData.system as 'KR' | 'US' | 'UK') || null,
        grade: formData.grade || null,
        birthdate: formData.birthdate ? formData.birthdate.toISOString().split('T')[0] : undefined,
        gender: formData.gender as 'male' | 'female',
        isActive: true,
        permissions: {}
      });

      toast({ title: "성공", description: "회원가입이 완료되었습니다. 로그인해주세요." });
      navigate('/login');
    } catch (error) {
      toast({ 
        title: "오류", 
        description: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.',
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!allowSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>회원가입 불가</CardTitle>
            <CardDescription>현재 학생 자가가입이 허용되지 않습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              로그인 페이지로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[500px]">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6" />
            학생 회원가입
          </CardTitle>
          <CardDescription>새 계정을 만들어보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              모든 계정의 초기 비밀번호는 <strong>1111</strong>로 자동 설정됩니다. 
              가입 후 로그인하여 비밀번호를 변경해주세요.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="이름"
                  required
                />
              </div>
              <div>
                <Label htmlFor="username">생성될 아이디</Label>
                <Input
                  id="username"
                  value={formData.username}
                  placeholder={formData.birthdate ? "생년월일 입력 후 자동 생성" : "생년월일을 먼저 입력해주세요"}
                  disabled
                  className="bg-muted font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  생년월일 기반으로 자동 생성됩니다
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthdate">생년월일 *</Label>
                <EnhancedDatePicker
                  value={formData.birthdate}
                  onChange={(date) => setFormData(prev => ({ ...prev, birthdate: date }))}
                  placeholder="생년월일 선택"
                />
              </div>
              <div>
                <Label htmlFor="gender">성별 *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">남</SelectItem>
                    <SelectItem value="female">여</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="system">학제</Label>
                <Select value={formData.system} onValueChange={(value) => setFormData(prev => ({ ...prev, system: value, grade: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="학제 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KR">한국</SelectItem>
                    <SelectItem value="US">미국</SelectItem>
                    <SelectItem value="UK">영국</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="grade">학년</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="학년"
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>아이디 생성 규칙:</strong> 생년월일(YYYYMMDD) 기반으로 자동 생성됩니다. 
                동일한 생년월일이 있는 경우 자동으로 -1, -2, -3... 등이 추가됩니다.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "가입 중..." : "회원가입"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/login')}
                className="text-sm"
              >
                이미 계정이 있으신가요? 로그인
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}