import React, { useState, useEffect } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AuthGate } from "@/components/auth/AuthGate";
import { CreateStudentFormModal } from '@/components/admin/CreateStudentFormModal';
import { StudentListManager } from '@/components/admin/StudentListManager';
import { StudentSelfSignupToggle } from '@/components/admin/StudentSelfSignupToggle';
import { StudentEditRegressionTest } from '@/components/admin/StudentEditRegressionTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart3 } from 'lucide-react';
import { memoryRepo } from '@/repositories/memoryRepo';
import { User } from '@/store/userStore';
import { batchMigrateUsers } from '@/utils/gradeConversion';
import { toast } from '@/hooks/use-toast';
import '@/utils/regressionTest';

export default function StudentsManagement() {
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    const allStudents = memoryRepo.users.getStudents();
    
    // Check if any students need grade/system migration
    const { users: migratedStudents, migrationCount } = batchMigrateUsers(allStudents);
    
    // Update users if any migrations were performed
    if (migrationCount > 0) {
      // Update each migrated user in the store
      migratedStudents.forEach(student => {
        const originalStudent = allStudents.find(s => s.id === student.id);
        if (originalStudent && (originalStudent.grade !== student.grade || originalStudent.system !== student.system)) {
          memoryRepo.users.update(student.id, {
            grade: student.grade,
            system: student.system
          });
        }
      });
      
      toast({
        title: "데이터 변환 완료",
        description: `${migrationCount}명의 학생 데이터를 새로운 학년 표기 규칙으로 변환했습니다.`
      });
    }
    
    setStudents(migratedStudents);
  };

  const getStatistics = () => {
    const systems = [...new Set(students.filter(s => s.system).map(s => s.system))];
    const grades = [...new Set(students.filter(s => s.grade).map(s => s.grade))];
    const classes = [...new Set(students.filter(s => s.className).map(s => s.className))];
    
    return {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.isActive).length,
      educationSystems: systems.length,
      grades: grades.length,
      classes: classes.length
    };
  };

  const stats = getStatistics();

  return (
    <AuthGate requireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">학생 관리</h1>
              <p className="text-muted-foreground mt-2">
                학생 계정을 생성하고 관리하세요.
              </p>
            </div>
            
            <CreateStudentFormModal onStudentCreated={loadStudents} />
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    <p className="text-muted-foreground text-sm">총 학생 수</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeStudents}</p>
                    <p className="text-muted-foreground text-sm">활성 학생</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Badge className="h-8 w-8 flex items-center justify-center text-lg">
                    {stats.grades}
                  </Badge>
                  <div>
                    <p className="text-2xl font-bold">{stats.grades}</p>
                    <p className="text-muted-foreground text-sm">학년</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Badge className="h-8 w-8 flex items-center justify-center text-lg">
                    {stats.classes}
                  </Badge>
                  <div>
                    <p className="text-2xl font-bold">{stats.classes}</p>
                    <p className="text-muted-foreground text-sm">반</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings */}
            <div className="lg:col-span-1 space-y-6">
              <StudentSelfSignupToggle />
              <StudentEditRegressionTest />
            </div>

            {/* Student List */}
            <div className="lg:col-span-2">
              <StudentListManager
                students={students}
                onStudentsUpdate={loadStudents}
              />
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGate>
  );
}