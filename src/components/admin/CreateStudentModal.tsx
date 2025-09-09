import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import SystemSelector from "@/components/test-select/SystemSelector";
import GradeSelector from "@/components/test-select/GradeSelector";

type SystemType = "korea" | "us" | "uk";

interface CreateStudentModalProps {
  onStudentCreated?: () => void;
}

interface FormData {
  username: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  school: string;
  grade: string;
  system_type: SystemType | null;
}

export function CreateStudentModal({ onStudentCreated }: CreateStudentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    full_name: "",
    date_of_birth: "",
    gender: "",
    school: "",
    grade: "",
    system_type: null
  });
  const [createdStudent, setCreatedStudent] = useState<{
    username: string;
    temp_password: string;
    full_name: string;
    gender: string;
    school: string | null;
    grade: string | null;
    system_type: string;
  } | null>(null);

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast({ title: "오류", description: "아이디를 입력해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.full_name.trim()) {
      toast({ title: "오류", description: "이름을 입력해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.date_of_birth) {
      toast({ title: "오류", description: "생년월일을 입력해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.gender) {
      toast({ title: "오류", description: "성별을 선택해주세요.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSystemSelect = (system: SystemType) => {
    setFormData(prev => ({ 
      ...prev, 
      system_type: system,
      grade: "" // Reset grade when system changes
    }));
  };

  const handleGradeSelect = (grade: string) => {
    setFormData(prev => ({ ...prev, grade }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const sessionToken = localStorage.getItem('tn_academy_session_token');
      if (!sessionToken) {
        toast({ title: "오류", description: "로그인이 필요합니다.", variant: "destructive" });
        return;
      }

      const response = await fetch(`https://klotxqfcjlzdevohzqlm.supabase.co/functions/v1/admin-create-student-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken
        },
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          school: formData.school || null,
          grade: formData.grade || null,
          system_type: formData.system_type
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '학생 계정 생성에 실패했습니다.');
      }

      setCreatedStudent(result);
      toast({ title: "성공", description: "학생 계정이 성공적으로 생성되었습니다!" });
      onStudentCreated?.();
      
    } catch (error) {
      console.error('학생 생성 오류:', error);
      toast({ 
        title: "오류", 
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
      full_name: "",
      date_of_birth: "",
      gender: "",
      school: "",
      grade: "",
      system_type: null
    });
  };

  const renderForm = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">학생 정보 입력</h3>
        <p className="text-muted-foreground text-sm">새 학생의 정보를 입력해주세요</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">아이디 *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="학생 아이디"
            required
          />
        </div>
        <div>
          <Label htmlFor="full_name">이름 *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="학생 이름"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date_of_birth">생년월일 *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="gender">성별 *</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="성별 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">남성</SelectItem>
              <SelectItem value="female">여성</SelectItem>
              <SelectItem value="other">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="school">학교 (선택사항)</Label>
        <Input
          id="school"
          value={formData.school}
          onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
          placeholder="학교명"
        />
      </div>

      <div>
        <Label>교육 시스템 (선택사항)</Label>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <SystemSelector 
              selected={formData.system_type} 
              onSelect={handleSystemSelect} 
            />
          </div>
          {formData.system_type && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                system_type: null, 
                grade: "" 
              }))}
            >
              선택 해제
            </Button>
          )}
        </div>
      </div>
      
      {formData.system_type && (
        <div>
          <Label>학년 (선택사항)</Label>
          <GradeSelector 
            system={formData.system_type}
            selected={formData.grade || null}
            onSelect={handleGradeSelect}
          />
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 학생 추가
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
                  <div className="font-mono bg-muted p-2 rounded border text-destructive font-bold">{createdStudent.temp_password}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">이름</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdStudent.full_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">성별</Label>
                  <div className="font-mono bg-muted p-2 rounded border">
                    {createdStudent.gender === 'male' ? '남성' : createdStudent.gender === 'female' ? '여성' : '기타'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">교육시스템</Label>
                  <div className="font-mono bg-muted p-2 rounded border">
                    {createdStudent.system_type === 'korea' ? '한국 학년제' : 
                     createdStudent.system_type === 'us' ? '미국 학년제' : '영국 학년제'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">학년</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdStudent.grade || '미지정'}</div>
                </div>
              </div>

              {createdStudent.school && (
                <div>
                  <Label className="text-sm font-medium">학교</Label>
                  <div className="font-mono bg-muted p-2 rounded border">{createdStudent.school}</div>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-4">
                * 학생이 처음 로그인할 때 비밀번호를 변경해야 합니다.
              </p>
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
                {loading ? "생성 중..." : "학생 생성"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}