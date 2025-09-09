import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, EyeOff, KeyRound, Trash2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { memoryRepo } from "@/repositories/memoryRepo";
import { User } from "@/store/userStore";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EditStudentModal } from "./EditStudentModal";

// 정규화 함수들
const normalizeGrade = (grade: string | null, system: string | null): string => {
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

const normalizeSystem = (system: string | null): string | null => {
  if (!system) return null;
  
  const lowerSystem = system.toLowerCase();
  if (lowerSystem === 'korea' || lowerSystem === 'kr') return 'KR';
  if (lowerSystem === 'us' || lowerSystem === 'usa' || lowerSystem === 'america') return 'US';
  if (lowerSystem === 'uk' || lowerSystem === 'britain' || lowerSystem === 'england') return 'UK';
  
  return system;
};

interface StudentListManagerProps {
  students: User[];
  onStudentsUpdate: () => void;
}

export function StudentListManager({ students, onStudentsUpdate }: StudentListManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.system && student.system.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [students, searchTerm]);

  const handleToggleActive = (student: User) => {
    try {
      memoryRepo.users.update(student.id, { isActive: !student.isActive });
      toast({
        title: "성공",
        description: `${student.name} 계정을 ${!student.isActive ? '활성화' : '비활성화'}했습니다.`
      });
      onStudentsUpdate();
    } catch (error) {
      toast({
        title: "권한이 없습니다",
        description: error instanceof Error ? error.message : "계정 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = (student: User) => {
    try {
      const newPassword = memoryRepo.users.resetPassword(student.id);
      toast({
        title: "비밀번호 재설정 완료",
        description: `${student.name}의 비밀번호가 1111로 재설정되었습니다.`,
      });
      onStudentsUpdate();
    } catch (error) {
      toast({
        title: "권한이 없습니다",
        description: error instanceof Error ? error.message : "비밀번호 재설정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStudent = (student: User) => {
    try {
      memoryRepo.users.remove(student.id);
      toast({
        title: "성공",
        description: `${student.name} 계정을 삭제했습니다.`
      });
      onStudentsUpdate();
    } catch (error) {
      toast({
        title: "권한이 없습니다",
        description: error instanceof Error ? error.message : "계정 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleStudentUpdated = (updatedData: any) => {
    try {
      // Update the user in the store with the updated data
      memoryRepo.users.update(updatedData.student_id, {
        name: updatedData.full_name,
        birthdate: updatedData.date_of_birth,
        gender: updatedData.gender,
        system: updatedData.system_type,
        grade: updatedData.grade,
        privateNote: updatedData.private_note
      });
      setEditingStudent(null);
      onStudentsUpdate();
      toast({
        title: "성공",
        description: "학생 정보가 업데이트되었습니다."
      });
    } catch (error) {
      toast({
        title: "권한이 없습니다",
        description: error instanceof Error ? error.message : "학생 정보 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>학생 계정 관리</CardTitle>
        <CardDescription>
          등록된 학생 계정을 관리하고 검색할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름, 아이디, 반, 학제로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 학생 목록 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>아이디</TableHead>
                  <TableHead>학제/학년</TableHead>
                  <TableHead>생년월일</TableHead>
                  <TableHead>성별</TableHead>
                  <TableHead>반</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>관리자 메모</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="font-mono text-sm">{student.username}</TableCell>
                       <TableCell>
                         {student.system && student.grade ? (
                           <Badge variant="outline">
                             {normalizeSystem(student.system)} {normalizeGrade(student.grade, student.system)}
                           </Badge>
                         ) : (
                           <span className="text-muted-foreground">-</span>
                         )}
                       </TableCell>
                      <TableCell className="font-mono text-sm">{student.birthdate || '-'}</TableCell>
                      <TableCell>
                        {student.gender === 'male' ? '남' : student.gender === 'female' ? '여' : '-'}
                      </TableCell>
                      <TableCell>{student.className || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{student.phone || '-'}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {student.privateNote ? (
                          <div className="text-xs text-muted-foreground truncate" title={student.privateNote}>
                            {student.privateNote}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStudent(student)}
                            title="편집"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(student)}
                            title={student.isActive ? "비활성화" : "활성화"}
                          >
                            {student.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(student)}
                            title="비밀번호 재설정"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>계정 삭제 확인</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{student.name}</strong> 학생의 계정을 삭제하시겠습니까? 
                                  이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStudent(student)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="text-sm text-muted-foreground">
              총 {filteredStudents.length}명의 학생
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          student={{
            id: editingStudent.id,
            username: editingStudent.username,
            full_name: editingStudent.name,
            date_of_birth: editingStudent.birthdate || "",
            private_note: editingStudent.privateNote || "",
            student_profiles: [{
              gender: editingStudent.gender || "",
              school: "",
              grade: normalizeGrade(editingStudent.grade, editingStudent.system),
              system_type: normalizeSystem(editingStudent.system)
            }]
          }}
          open={true}
          onClose={() => setEditingStudent(null)}
          onStudentUpdated={handleStudentUpdated}
        />
      )}
    </Card>
  );
}