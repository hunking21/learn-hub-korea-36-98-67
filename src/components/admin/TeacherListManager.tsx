import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, EyeOff, KeyRound, Trash2, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { userStore, User } from "@/store/userStore";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TeacherListManagerProps {
  teachers: User[];
  onTeachersUpdate: () => void;
}

interface PermissionEditModalProps {
  teacher: User;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

function PermissionEditModal({ teacher, open, onClose, onUpdate }: PermissionEditModalProps) {
  const [permissions, setPermissions] = useState(teacher.permissions);

  const handleSave = () => {
    try {
      userStore.updateUser(teacher.id, { permissions });
      toast({
        title: "성공",
        description: `${teacher.name}의 권한이 업데이트되었습니다.`
      });
      onUpdate();
      onClose();
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "권한 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{teacher.name} - 권한 설정</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>문제은행 편집 권한</Label>
              <p className="text-sm text-muted-foreground">문제를 추가, 수정, 삭제할 수 있습니다.</p>
            </div>
            <Switch
              checked={permissions.canEditQuestionBank}
              onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, canEditQuestionBank: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>계정발급 권한</Label>
              <p className="text-sm text-muted-foreground">학생 및 교사 계정을 생성할 수 있습니다.</p>
            </div>
            <Switch
              checked={permissions.canCreateAccounts}
              onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, canCreateAccounts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>시험 관리 권한</Label>
              <p className="text-sm text-muted-foreground">시험을 생성, 배포, 관리할 수 있습니다.</p>
            </div>
            <Switch
              checked={permissions.canManageTests}
              onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, canManageTests: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>분석 보기 권한</Label>
              <p className="text-sm text-muted-foreground">시험 결과와 통계를 볼 수 있습니다.</p>
            </div>
            <Switch
              checked={permissions.canViewAnalytics}
              onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, canViewAnalytics: checked }))}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TeacherListManager({ teachers, onTeachersUpdate }: TeacherListManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.phone && teacher.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teachers, searchTerm]);

  const handleToggleActive = (teacher: User) => {
    try {
      userStore.updateUser(teacher.id, { isActive: !teacher.isActive });
      toast({
        title: "성공",
        description: `${teacher.name} 계정을 ${!teacher.isActive ? '활성화' : '비활성화'}했습니다.`
      });
      onTeachersUpdate();
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "계정 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = (teacher: User) => {
    try {
      const newPassword = userStore.resetPassword(teacher.id);
      toast({
        title: "비밀번호 재설정 완료",
        description: `${teacher.name}의 새 비밀번호: ${newPassword}`,
      });
      onTeachersUpdate();
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "비밀번호 재설정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeacher = (teacher: User) => {
    try {
      userStore.deleteUser(teacher.id);
      toast({
        title: "성공",
        description: `${teacher.name} 계정을 삭제했습니다.`
      });
      onTeachersUpdate();
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "계정 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const openPermissionModal = (teacher: User) => {
    setSelectedTeacher(teacher);
    setPermissionModalOpen(true);
  };

  const getPermissionBadges = (permissions: any) => {
    const badges = [];
    if (permissions.canEditQuestionBank) badges.push("문제은행");
    if (permissions.canCreateAccounts) badges.push("계정발급");
    if (permissions.canManageTests) badges.push("시험관리");
    if (permissions.canViewAnalytics) badges.push("분석");
    return badges;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>교사 계정 관리</CardTitle>
        <CardDescription>
          등록된 교사 계정을 관리하고 권한을 설정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름, 아이디, 연락처로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 교사 목록 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>아이디</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 교사가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell className="font-mono text-sm">{teacher.username}</TableCell>
                      <TableCell className="font-mono text-sm">{teacher.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getPermissionBadges(teacher.permissions).map((badge, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                          {getPermissionBadges(teacher.permissions).length === 0 && (
                            <span className="text-muted-foreground text-sm">권한 없음</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.isActive ? "default" : "secondary"}>
                          {teacher.isActive ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPermissionModal(teacher)}
                            title="권한 설정"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(teacher)}
                            title={teacher.isActive ? "비활성화" : "활성화"}
                          >
                            {teacher.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(teacher)}
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
                                  <strong>{teacher.name}</strong> 교사의 계정을 삭제하시겠습니까? 
                                  이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTeacher(teacher)}
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

          {filteredTeachers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              총 {filteredTeachers.length}명의 교사
            </div>
          )}
        </div>

        {/* 권한 설정 모달 */}
        {selectedTeacher && (
          <PermissionEditModal
            teacher={selectedTeacher}
            open={permissionModalOpen}
            onClose={() => {
              setPermissionModalOpen(false);
              setSelectedTeacher(null);
            }}
            onUpdate={onTeachersUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}