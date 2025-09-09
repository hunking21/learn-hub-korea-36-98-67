
import React, { useState, useEffect } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CreateTeacherModal } from '@/components/admin/CreateTeacherModal';
import { TeacherListManager } from '@/components/admin/TeacherListManager';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart3 } from 'lucide-react';
import { userStore, User } from '@/store/userStore';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<User[]>([]);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = () => {
    setTeachers(userStore.getTeachers());
  };

  const getStatistics = () => {
    return {
      totalTeachers: teachers.length,
      activeTeachers: teachers.filter(t => t.isActive).length,
      withQuestionBankPerm: teachers.filter(t => t.permissions.canEditQuestionBank).length,
      withAccountPerm: teachers.filter(t => t.permissions.canCreateAccounts).length
    };
  };

  const stats = getStatistics();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">교사 관리</h1>
            <p className="text-muted-foreground mt-2">
              교사 계정을 생성하고 권한을 관리하세요.
            </p>
          </div>
          
          <CreateTeacherModal onTeacherCreated={loadTeachers} />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                  <p className="text-muted-foreground text-sm">총 교사 수</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeTeachers}</p>
                  <p className="text-muted-foreground text-sm">활성 교사</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Badge className="h-8 w-8 flex items-center justify-center text-lg">
                  {stats.withQuestionBankPerm}
                </Badge>
                <div>
                  <p className="text-2xl font-bold">{stats.withQuestionBankPerm}</p>
                  <p className="text-muted-foreground text-sm">문제은행 권한</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Badge className="h-8 w-8 flex items-center justify-center text-lg">
                  {stats.withAccountPerm}
                </Badge>
                <div>
                  <p className="text-2xl font-bold">{stats.withAccountPerm}</p>
                  <p className="text-muted-foreground text-sm">계정발급 권한</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher List */}
        <TeacherListManager
          teachers={teachers}
          onTeachersUpdate={loadTeachers}
        />
      </div>
    </AdminLayout>
  );
}
