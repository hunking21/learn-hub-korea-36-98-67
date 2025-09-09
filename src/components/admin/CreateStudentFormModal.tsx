import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Info } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { generateUsernameFromBirthdate } from "@/utils/usernameGenerator";
import { User } from "@/store/userStore";
import { memoryRepo } from '@/repositories/memoryRepo';
import { useAuth } from '@/contexts/AuthContext';

interface CreateStudentFormModalProps {
  onStudentCreated?: () => void;
}

interface FormData {
  username: string;
  name: string;
  system: 'KR' | 'US' | 'UK' | null;
  grade: string | null;
  phone: string;
  className: string;
  birthdate: Date | undefined;
  gender: string;
  privateNote: string;
}

// 학제별 학년 데이터 (updated notation)
const gradeOptions: Record<'KR' | 'US' | 'UK', string[]> = {
  KR: [
    '초1', '초2', '초3', '초4', '초5', '초6',
    '중1', '중2', '중3',
    '고1', '고2', '고3'
  ],
  US: [
    'GK', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'
  ],
  UK: [
    'Yr1', 'Yr2', 'Yr3', 'Yr4', 'Yr5', 'Yr6', 'Yr7', 'Yr8',
    'Yr9', 'Yr10', 'Yr11', 'Yr12', 'Yr13'
  ]
};

export function CreateStudentFormModal({ onStudentCreated }: CreateStudentFormModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const [createdStudent, setCreatedStudent] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    name: "",
    system: null,
    grade: null,
    phone: "",
    className: "",
    birthdate: undefined,
    gender: "",
    privateNote: ""
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
  
  const hasPermission = () => {
    return profile?.role === 'admin' || (profile as any)?.permissions?.accountIssue === true;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({ title: "오류", description: "이름을 입력해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.birthdate) {
      toast({ title: "오류", description: "생년월일을 선택해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.gender) {
      toast({ title: "오류", description: "성별을 선택해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.system) {
      toast({ title: "오류", description: "학제를 선택해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.grade) {
      toast({ title: "오류", description: "학년을 선택해주세요.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSystemChange = (system: 'KR' | 'US' | 'UK') => {
    setFormData(prev => ({ 
      ...prev, 
      system, 
      grade: null // 학제 변경 시 학년 초기화
    }));
  };

  const handleSystemClear = () => {
    setFormData(prev => ({ 
      ...prev, 
      system: null, 
      grade: null
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    if (!hasPermission()) {
      toast({ 
        title: "권한이 없습니다", 
        description: "학생 계정 생성 권한이 없습니다.",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    
    try {
      const newStudent = memoryRepo.users.create({
        username: formData.username,
        password: '1111', // 기본 비밀번호
        name: formData.name,
        role: 'STUDENT',
        system: formData.system,
        grade: formData.grade,
        phone: formData.phone || undefined,
        className: formData.className || undefined,
        birthdate: formData.birthdate ? format(formData.birthdate, 'yyyy-MM-dd') : undefined,
        gender: formData.gender as 'male' | 'female',
        isActive: true,
        permissions: {},
        privateNote: formData.privateNote || undefined
      });

      setCreatedStudent(newStudent);
      toast({ title: "성공", description: "학생 계정이 성공적으로 생성되었습니다!" });
      onStudentCreated?.();
      
    } catch (error) {
      console.error('학생 생성 오류:', error);
      toast({ 
        title: "권한이 없습니다", 
        description: error instanceof Error ? error.message : '학생 계정 생성 중 오류가 발생했습니다.',
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedStudent(null);
        setFormData({
          username: "",
          name: "",
          system: null,
          grade: null,
          phone: "",
          className: "",
          birthdate: undefined,
          gender: "",
          privateNote: ""
        });
  };

  const renderForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">학생 계정 생성</h3>
        <p className="text-muted-foreground text-sm">새 학생의 정보를 입력해주세요</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          모든 신규 학생 계정의 초기 비밀번호는 <strong>1111</strong>로 설정됩니다. 
          학생은 로그인 후 우상단 "내 계정 → 비밀번호 변경"에서 변경할 수 있습니다.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">이름 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="학생 이름"
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
          <Label htmlFor="system">학제 *</Label>
          <div className="flex gap-2">
            <Select value={formData.system || ""} onValueChange={handleSystemChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="학제 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KR">한국</SelectItem>
                <SelectItem value="US">미국</SelectItem>
                <SelectItem value="UK">영국</SelectItem>
              </SelectContent>
            </Select>
            {formData.system && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleSystemClear}
              >
                선택 해제
              </Button>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="grade">학년 *</Label>
          <Select 
            value={formData.grade || ""} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}
            disabled={!formData.system}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.system ? "학년 선택" : "먼저 학제를 선택하세요"} />
            </SelectTrigger>
            <SelectContent>
              {formData.system && gradeOptions[formData.system]?.map((grade) => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">연락처</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="연락처"
          />
        </div>
        <div>
          <Label htmlFor="className">반</Label>
          <Input
            id="className"
            value={formData.className}
            onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
            placeholder="반"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="privateNote">관리자/교사 메모 (학생 미노출)</Label>
        <div className="mt-2">
          <textarea
            id="privateNote"
            value={formData.privateNote}
            onChange={(e) => setFormData(prev => ({ ...prev, privateNote: e.target.value }))}
            placeholder="학생에게 노출되지 않는 관리자/교사용 메모를 입력하세요..."
            className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-background resize-vertical"
          />
          <p className="text-xs text-muted-foreground mt-1">
            이 메모는 관리자와 교사만 볼 수 있으며, 학생에게는 노출되지 않습니다.
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>아이디 생성 규칙:</strong> 생년월일(YYYYMMDD) 기반으로 자동 생성됩니다. 
          동일한 생년월일이 있는 경우 자동으로 -1, -2, -3... 등이 추가됩니다.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          학생 계정 만들기
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 학생 계정 생성</DialogTitle>
        </DialogHeader>
        
        {createdStudent ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">학생 계정이 생성되었습니다!</CardTitle>
              <CardDescription>아래 정보를 학생에게 전달해주세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">아이디</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdStudent.username}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">임시 비밀번호</Label>
                  <div className="font-mono bg-muted p-2 rounded border text-destructive font-bold">1111</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">이름</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdStudent.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">학제</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdStudent.system || '미지정'}</div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  학생은 로그인 후 우상단 "내 계정 → 비밀번호 변경"에서 비밀번호를 변경할 수 있습니다.
                </AlertDescription>
              </Alert>

              <Button type="button" onClick={handleClose} className="w-full">
                확인
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderForm()}

            <div className="flex gap-2 pt-4 border-t">
              <div className="flex-1" />
              
              <Button type="button" variant="outline" onClick={handleClose}>
                취소
              </Button>
              
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? "생성 중..." : "학생 생성"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}