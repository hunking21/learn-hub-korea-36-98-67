import { useState } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { readPerms, setTeacherPerm } from '@/utils/mockPerms';

export default function PermissionsManagement() {
  const [teacherId, setTeacherId] = useState('');
  const [canCreateQuestions, setCanCreateQuestions] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (!teacherId.trim()) {
      toast({
        title: "오류",
        description: "교사 아이디를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setTeacherPerm(teacherId, { canCreateQuestions });
    toast({
      title: "저장됨",
      description: `${teacherId} 교사의 권한이 저장되었습니다.`,
    });

    // 입력 필드 초기화
    setTeacherId('');
    setCanCreateQuestions(false);
  };

  const currentPermissions = readPerms();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">권한 관리</h1>
          <p className="text-muted-foreground mt-2">
            교사별 권한을 관리할 수 있습니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>교사 권한 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="teacherId">교사 아이디</Label>
                <Input
                  id="teacherId"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  placeholder="교사 아이디 입력"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="canCreateQuestions"
                  checked={canCreateQuestions}
                  onCheckedChange={setCanCreateQuestions}
                />
                <Label htmlFor="canCreateQuestions">문제 생성 허용</Label>
              </div>
              
              <Button onClick={handleSave}>저장</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>현재 권한 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(currentPermissions.teachers).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                설정된 권한이 없습니다.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>교사 아이디</TableHead>
                    <TableHead>문제 생성 허용</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(currentPermissions.teachers).map(([username, perms]) => (
                    <TableRow key={username}>
                      <TableCell className="font-medium">{username}</TableCell>
                      <TableCell>
                        {perms.canCreateQuestions ? (
                          <span className="text-green-600">허용</span>
                        ) : (
                          <span className="text-red-600">금지</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}