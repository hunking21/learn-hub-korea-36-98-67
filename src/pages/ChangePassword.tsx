import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { userStore } from '@/store/userStore';
import { useAuth } from '@/contexts/AuthContext';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "오류", description: "로그인이 필요합니다.", variant: "destructive" });
      navigate('/login');
      return;
    }

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({ title: "오류", description: "모든 항목을 입력해주세요.", variant: "destructive" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: "오류", description: "새 비밀번호가 일치하지 않습니다.", variant: "destructive" });
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      toast({ title: "오류", description: "현재 비밀번호와 새 비밀번호가 같습니다.", variant: "destructive" });
      return;
    }

    if (formData.newPassword.length < 4) {
      toast({ title: "오류", description: "새 비밀번호는 최소 4자 이상이어야 합니다.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 현재 비밀번호 확인
      const currentUser = userStore.authenticate(user.username, formData.currentPassword);
      if (!currentUser) {
        toast({ title: "오류", description: "현재 비밀번호가 올바르지 않습니다.", variant: "destructive" });
        return;
      }

      // 비밀번호 변경
      userStore.updateUser(user.id, { password: formData.newPassword });
      
      toast({ title: "성공", description: "비밀번호가 성공적으로 변경되었습니다." });
      navigate(-1); // 이전 페이지로 이동
    } catch (error) {
      toast({ 
        title: "오류", 
        description: error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.',
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle>접근 권한 없음</CardTitle>
            <CardDescription>로그인이 필요합니다.</CardDescription>
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-[500px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                비밀번호 변경
              </CardTitle>
              <CardDescription>보안을 위해 정기적으로 비밀번호를 변경하세요</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">현재 비밀번호</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="현재 비밀번호를 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="새 비밀번호를 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="새 비밀번호를 다시 입력하세요"
                required
              />
            </div>

            <div className="pt-4 space-y-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "변경 중..." : "비밀번호 변경"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="w-full"
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}