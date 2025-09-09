import React, { useState } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentsManagement from './StudentsManagement';
import TeacherManagement from './TeacherManagement';
import PermissionsManagement from './PermissionsManagement';

export default function UserManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">사용자 관리</h1>
          <p className="text-muted-foreground mt-2">
            학생, 교사 계정과 권한을 통합 관리하세요.
          </p>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">학생 관리</TabsTrigger>
            <TabsTrigger value="teachers">교사 관리</TabsTrigger>
            <TabsTrigger value="permissions">권한 관리</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="mt-6">
            <StudentsManagement />
          </TabsContent>
          
          <TabsContent value="teachers" className="mt-6">
            <TeacherManagement />
          </TabsContent>
          
          <TabsContent value="permissions" className="mt-6">
            <PermissionsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}