import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type SystemType = 'KR' | 'US' | 'UK' | null;

interface EditStudentModalProps {
  student: any;
  open: boolean;
  onClose: () => void;
  onStudentUpdated: (updatedData: any) => void;
}

interface FormData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  school: string;
  grade: string;
  system_type: SystemType;
  private_note: string;
}

// 학제별 학년 데이터
const gradeOptionsMap: Record<'KR' | 'US' | 'UK', string[]> = {
  KR: ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'],
  US: ['GK', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
  UK: ['Yr1', 'Yr2', 'Yr3', 'Yr4', 'Yr5', 'Yr6', 'Yr7', 'Yr8', 'Yr9', 'Yr10', 'Yr11', 'Yr12', 'Yr13']
};

// 기존 데이터 정규화 함수
const normalizeGrade = (grade: string | null, system: SystemType): string => {
  if (!grade || !system) return '';
  
  // US 시스템 정규화
  if (system === 'US') {
    if (grade === 'K' || grade === 'Kindergarten') return 'GK';
    if (grade.match(/^(\d+)(st|nd|rd|th)$/)) {
      const num = grade.match(/^(\d+)/)?.[1];
      return num ? `G${num}` : grade;
    }
    if (grade.match(/^Grade\s+(\d+)$/)) {
      const num = grade.match(/^Grade\s+(\d+)$/)?.[1];
      return num ? `G${num}` : grade;
    }
  }
  
  // UK 시스템 정규화
  if (system === 'UK') {
    if (grade.match(/^Year\s+(\d+)$/)) {
      const num = grade.match(/^Year\s+(\d+)$/)?.[1];
      return num ? `Yr${num}` : grade;
    }
  }
  
  return grade;
};

const normalizeSystem = (system: string | null): SystemType => {
  if (!system) return null;
  
  const lowerSystem = system.toLowerCase();
  if (lowerSystem === 'korea' || lowerSystem === 'kr') return 'KR';
  if (lowerSystem === 'us' || lowerSystem === 'usa' || lowerSystem === 'america') return 'US';
  if (lowerSystem === 'uk' || lowerSystem === 'britain' || lowerSystem === 'england') return 'UK';
  
  return system as SystemType;
};

export function EditStudentModal({ student, open, onClose, onStudentUpdated }: EditStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    date_of_birth: "",
    gender: "",
    school: "",
    grade: "",
    system_type: null,
    private_note: ""
  });

  const { profile } = useAuth();

  useEffect(() => {
    if (student) {
      const studentProfile = student.student_profiles?.[0];
      
      // 시스템과 학년 정규화
      const normalizedSystem = normalizeSystem(studentProfile?.system_type);
      const rawGrade = studentProfile?.grade || '';
      const normalizedGrade = normalizeGrade(rawGrade, normalizedSystem);
      
      // 정규화된 학년이 해당 시스템의 옵션에 포함되는지 확인
      const gradeOptions = normalizedSystem ? gradeOptionsMap[normalizedSystem] : [];
      const finalGrade = gradeOptions.includes(normalizedGrade) ? normalizedGrade : '';
      
      setFormData({
        full_name: student.full_name || "",
        date_of_birth: student.date_of_birth || "",
        gender: studentProfile?.gender || "",
        school: studentProfile?.school || "",
        grade: finalGrade,
        system_type: normalizedSystem,
        private_note: student.private_note || ""
      });
    }
  }, [student]);

  const validateForm = () => {
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
    if (!formData.system_type) {
      toast({ title: "오류", description: "교육 시스템을 선택해주세요.", variant: "destructive" });
      return false;
    }
    if (!formData.grade) {
      toast({ title: "오류", description: "학년을 선택해주세요.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const hasPermission = () => {
    return profile?.role === 'admin' || (profile as any)?.permissions?.accountIssue === true;
  };

  const handleSystemSelect = (system: 'KR' | 'US' | 'UK') => {
    setFormData(prev => ({ 
      ...prev, 
      system_type: system,
      grade: "" // Reset grade when system changes
    }));
  };

  const handleSystemClear = () => {
    setFormData(prev => ({ 
      ...prev, 
      system_type: null, 
      grade: ""
    }));
  };

  const handleGradeSelect = (grade: string) => {
    setFormData(prev => ({ ...prev, grade }));
  };

  // 현재 시스템에 대한 학년 옵션 계산
  const gradeOptions = formData.system_type ? gradeOptionsMap[formData.system_type] : [];
  
  // 현재 선택된 학년이 옵션에 없으면 초기화
  useEffect(() => {
    if (formData.grade && formData.system_type && !gradeOptions.includes(formData.grade)) {
      setFormData(prev => ({ ...prev, grade: "" }));
    }
  }, [formData.system_type, formData.grade, gradeOptions]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    if (!hasPermission()) {
      toast({ 
        title: "권한이 없습니다", 
        description: "학생 정보 수정 권한이 없습니다.",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    
    try {
      const { memoryRepo } = await import('@/repositories/memoryRepo');
      
      // Update student in memory repository
      memoryRepo.users.update(student.id, {
        name: formData.full_name,
        birthdate: formData.date_of_birth,
        gender: formData.gender as 'male' | 'female',
        system: formData.system_type,
        grade: formData.grade,
        privateNote: formData.private_note || undefined
      });

      toast({ title: "성공", description: "학생 정보가 성공적으로 업데이트되었습니다!" });
      
      // Pass updated data to parent for UI refresh
      onStudentUpdated({
        student_id: student.id,
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        school: formData.school || null,
        grade: formData.grade || null,
        system_type: formData.system_type,
        private_note: formData.private_note || null
      });
      
    } catch (error) {
      console.error('학생 정보 업데이트 오류:', error);
      toast({ 
        title: "권한이 없습니다", 
        description: error instanceof Error ? error.message : '학생 정보 업데이트 중 오류가 발생했습니다.',
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>학생 정보 수정 - {student?.username}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">학생 정보 수정</h3>
            <p className="text-muted-foreground text-sm">학생의 정보를 수정해주세요</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_full_name">이름 *</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="학생 이름"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_date_of_birth">생년월일 *</Label>
              <Input
                id="edit_date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit_gender">성별 *</Label>
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

          <div>
            <Label htmlFor="edit_school">학교 (선택사항)</Label>
            <Input
              id="edit_school"
              value={formData.school}
              onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
              placeholder="학교명"
            />
          </div>

          <div>
            <Label>교육 시스템 *</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Select value={formData.system_type ?? ''} onValueChange={handleSystemSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="교육 시스템 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KR">한국</SelectItem>
                    <SelectItem value="US">미국</SelectItem>
                    <SelectItem value="UK">영국</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.system_type && (
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
            <Label>학년 *</Label>
            <Select 
              value={formData.grade ?? ''} 
              onValueChange={handleGradeSelect}
              disabled={!formData.system_type}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.system_type ? "학년 선택" : "먼저 교육 시스템을 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="edit_private_note">관리자/교사 메모 (학생 미노출)</Label>
            <div className="mt-2">
              <textarea
                id="edit_private_note"
                value={formData.private_note}
                onChange={(e) => setFormData(prev => ({ ...prev, private_note: e.target.value }))}
                placeholder="학생에게 노출되지 않는 관리자/교사용 메모를 입력하세요..."
                className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-background resize-vertical"
              />
              <p className="text-xs text-muted-foreground mt-1">
                이 메모는 관리자와 교사만 볼 수 있으며, 학생에게는 노출되지 않습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <div className="flex-1" />
            
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            
            <Button 
              type="submit"
              disabled={loading}
            >
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}