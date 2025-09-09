import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Student {
  id: string;
  full_name: string;
  username: string;
  grade: string;
  school: string;
}

interface TestMaster {
  id: string;
  name: string;
  description: string;
}

interface StudentTestPermission {
  id: string;
  user_id: string;
  test_master_id: string;
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  student: Student;
  test_master: TestMaster;
  granted_by_user: { full_name: string };
}

const StudentTestPermissions = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [testMasters, setTestMasters] = useState<TestMaster[]>([]);
  const [permissions, setPermissions] = useState<StudentTestPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newPermission, setNewPermission] = useState({
    user_id: '',
    test_master_id: '',
    expires_at: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 학생 목록 로드
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, full_name, username, grade, school')
        .eq('role', 'student')
        .eq('is_active', true)
        .order('full_name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // 시험 목록 로드
      const { data: testsData, error: testsError } = await supabase
        .from('test_masters')
        .select('id, name, description')
        .order('name');

      if (testsError) throw testsError;
      setTestMasters(testsData || []);

      // 권한 목록 로드
      await loadPermissions();
    } catch (error) {
      console.error('데이터 로드 에러:', error);
      toast({
        title: "데이터 로드 실패",
        description: "데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('student_test_permissions')
        .select(`
          id,
          user_id,
          test_master_id,
          granted_by,
          granted_at,
          expires_at,
          is_active,
          created_at,
          updated_at
        `)
        .order('granted_at', { ascending: false });

      if (error) throw error;

      // 별도로 관련 데이터 조회
      const permissionsWithDetails = await Promise.all((data || []).map(async (permission) => {
        // 학생 정보 조회
        const { data: studentData } = await supabase
          .from('users')
          .select('id, full_name, username, grade, school')
          .eq('id', permission.user_id)
          .single();

        // 시험 정보 조회
        const { data: testData } = await supabase
          .from('test_masters')
          .select('id, name, description')
          .eq('id', permission.test_master_id)
          .single();

        // 권한 부여자 정보 조회
        const { data: grantedByData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', permission.granted_by)
          .single();

        return {
          ...permission,
          student: studentData,
          test_master: testData,
          granted_by_user: grantedByData
        };
      }));

      setPermissions(permissionsWithDetails as StudentTestPermission[]);
    } catch (error) {
      console.error('권한 목록 로드 에러:', error);
    }
  };

  const grantPermission = async () => {
    if (!newPermission.user_id || !newPermission.test_master_id) {
      toast({
        title: "입력 오류",
        description: "학생과 시험을 모두 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      // 현재 사용자 ID 가져오기
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('로그인이 필요합니다.');
      }

      const currentUser = sessionData.session.user;

      const permissionData = {
        user_id: newPermission.user_id,
        test_master_id: newPermission.test_master_id,
        granted_by: currentUser.id,
        expires_at: newPermission.expires_at || null,
        is_active: true
      };

      const { error } = await supabase
        .from('student_test_permissions')
        .insert([permissionData]);

      if (error) throw error;

      toast({
        title: "권한 부여 성공",
        description: "학생에게 시험 권한을 부여했습니다.",
      });

      setNewPermission({
        user_id: '',
        test_master_id: '',
        expires_at: '',
      });
      setIsDialogOpen(false);
      await loadPermissions();
    } catch (error: any) {
      console.error('권한 부여 에러:', error);
      toast({
        title: "권한 부여 실패",
        description: error.message || "권한 부여에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = async (permissionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('student_test_permissions')
        .update({ is_active: !isActive })
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: "권한 상태 변경",
        description: `권한이 ${!isActive ? '활성화' : '비활성화'}되었습니다.`,
      });

      await loadPermissions();
    } catch (error) {
      console.error('권한 상태 변경 에러:', error);
      toast({
        title: "상태 변경 실패",
        description: "권한 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const deletePermission = async (permissionId: string) => {
    if (!confirm('정말로 이 권한을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('student_test_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: "권한 삭제 성공",
        description: "시험 권한이 삭제되었습니다.",
      });

      await loadPermissions();
    } catch (error) {
      console.error('권한 삭제 에러:', error);
      toast({
        title: "권한 삭제 실패",
        description: "권한 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const filteredPermissions = permissions.filter(permission =>
    permission.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.test_master?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">학생 시험 권한 관리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              권한 부여
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 시험 권한 부여</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student-select">학생 선택</Label>
                <Select
                  value={newPermission.user_id}
                  onValueChange={(value) => setNewPermission({ ...newPermission, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="학생을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.username}) - {student.grade}학년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="test-select">시험 선택</Label>
                <Select
                  value={newPermission.test_master_id}
                  onValueChange={(value) => setNewPermission({ ...newPermission, test_master_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="시험을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {testMasters.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expires-at">만료일 (선택사항)</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={newPermission.expires_at}
                  onChange={(e) => setNewPermission({ ...newPermission, expires_at: e.target.value })}
                />
              </div>

              <Button onClick={grantPermission} disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    권한 부여 중...
                  </>
                ) : (
                  '권한 부여'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4" />
        <Input
          placeholder="학생명 또는 시험명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredPermissions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">부여된 권한이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPermissions.map((permission) => (
            <Card key={permission.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{permission.student?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {permission.student?.username} - {permission.student?.grade}학년
                        </p>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div>
                        <p className="font-medium">{permission.test_master?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          부여자: {permission.granted_by_user?.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>부여일: {new Date(permission.granted_at).toLocaleString()}</span>
                      {permission.expires_at && (
                        <span>만료일: {new Date(permission.expires_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${permission.id}`} className="text-sm">
                        활성
                      </Label>
                      <Switch
                        id={`active-${permission.id}`}
                        checked={permission.is_active}
                        onCheckedChange={() => togglePermission(permission.id, permission.is_active)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePermission(permission.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentTestPermissions;