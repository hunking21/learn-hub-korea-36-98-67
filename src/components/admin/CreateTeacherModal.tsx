import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { userStore, User } from "@/store/userStore";

interface CreateTeacherModalProps {
  onTeacherCreated?: () => void;
}

interface FormData {
  username: string;
  password: string;
  name: string;
  phone: string;
  canEditQuestionBank: boolean;
  canCreateAccounts: boolean;
  canManageTests: boolean;
  canViewAnalytics: boolean;
}

export function CreateTeacherModal({ onTeacherCreated }: CreateTeacherModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    name: "",
    phone: "",
    canEditQuestionBank: false,
    canCreateAccounts: false,
    canManageTests: false,
    canViewAnalytics: false
  });
  const [createdTeacher, setCreatedTeacher] = useState<User | null>(null);

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast({ title: "오류", description: "아이디를 입력해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.password.trim()) {
      toast({ title: "오류", description: "비밀번호를 입력해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.name.trim()) {
      toast({ title: "오류", description: "이름을 입력해주세요.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const newTeacher = userStore.createUser({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: 'TEACHER',
        system: null,
        grade: null,
        phone: formData.phone || undefined,
        isActive: true,
        permissions: {
          canEditQuestionBank: formData.canEditQuestionBank,
          canCreateAccounts: formData.canCreateAccounts,
          canManageTests: formData.canManageTests,
          canViewAnalytics: formData.canViewAnalytics
        }
      });

      setCreatedTeacher(newTeacher);
      toast({ title: "성공", description: "교사 계정이 성공적으로 생성되었습니다!" });
      onTeacherCreated?.();
      
    } catch (error) {
      console.error('교사 생성 오류:', error);
      toast({ 
        title: "오류", 
        description: error instanceof Error ? error.message : '교사 계정 생성 중 오류가 발생했습니다.',
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedTeacher(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      phone: "",
      canEditQuestionBank: false,
      canCreateAccounts: false,
      canManageTests: false,
      canViewAnalytics: false
    });
  };

  const renderForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">교사 계정 생성</h3>
        <p className="text-muted-foreground text-sm">새 교사의 정보와 권한을 설정해주세요</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">아이디 *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="교사 아이디"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">이름 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="교사 이름"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">비밀번호 *</Label>
        <div className="flex gap-2">
          <Input
            id="password"
            type="text"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="비밀번호"
            required
          />
          <Button type="button" variant="outline" onClick={generatePassword}>
            자동생성
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="phone">연락처</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="연락처"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">권한 설정</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="questionBank">문제은행 편집 권한</Label>
              <p className="text-sm text-muted-foreground">문제를 추가, 수정, 삭제할 수 있습니다.</p>
            </div>
            <Switch
              id="questionBank"
              checked={formData.canEditQuestionBank}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canEditQuestionBank: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="createAccounts">계정발급 권한</Label>
              <p className="text-sm text-muted-foreground">학생 및 교사 계정을 생성할 수 있습니다.</p>
            </div>
            <Switch
              id="createAccounts"
              checked={formData.canCreateAccounts}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canCreateAccounts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="manageTests">시험 관리 권한</Label>
              <p className="text-sm text-muted-foreground">시험을 생성, 배포, 관리할 수 있습니다.</p>
            </div>
            <Switch
              id="manageTests"
              checked={formData.canManageTests}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canManageTests: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="viewAnalytics">분석 보기 권한</Label>
              <p className="text-sm text-muted-foreground">시험 결과와 통계를 볼 수 있습니다.</p>
            </div>
            <Switch
              id="viewAnalytics"
              checked={formData.canViewAnalytics}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canViewAnalytics: checked }))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          교사 계정 만들기
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 교사 계정 생성</DialogTitle>
        </DialogHeader>
        
        {createdTeacher ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">교사 계정이 생성되었습니다!</CardTitle>
              <CardDescription>아래 정보를 교사에게 전달해주세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">아이디</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdTeacher.username}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">비밀번호</Label>
                  <div className="font-mono bg-muted p-2 rounded border text-destructive font-bold">{createdTeacher.password}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">이름</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdTeacher.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">연락처</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdTeacher.phone || '미등록'}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">부여된 권한</Label>
                <div className="space-y-1 mt-2">
                  {createdTeacher.permissions.canEditQuestionBank && <div className="text-sm">✓ 문제은행 편집</div>}
                  {createdTeacher.permissions.canCreateAccounts && <div className="text-sm">✓ 계정발급</div>}
                  {createdTeacher.permissions.canManageTests && <div className="text-sm">✓ 시험 관리</div>}
                  {createdTeacher.permissions.canViewAnalytics && <div className="text-sm">✓ 분석 보기</div>}
                  {!Object.values(createdTeacher.permissions).some(Boolean) && (
                    <div className="text-sm text-muted-foreground">권한 없음</div>
                  )}
                </div>
              </div>

              <Button onClick={handleClose} className="w-full">
                확인
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {renderForm()}

            <div className="flex gap-2 pt-4 border-t">
              <div className="flex-1" />
              
              <Button type="button" variant="outline" onClick={handleClose}>
                취소
              </Button>
              
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "생성 중..." : "교사 생성"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}