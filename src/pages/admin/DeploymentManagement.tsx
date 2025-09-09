import React from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLinks from './AdminLinks';
import ProctorMonitoring from './ProctorMonitoring';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Link, Monitor, Play } from "lucide-react";

export default function DeploymentManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">배포·진행 관리</h1>
          <p className="text-muted-foreground mt-2">
            시험 배포, 접속 링크 생성, 실시간 모니터링을 관리하세요.
          </p>
        </div>

        <Tabs defaultValue="deployment" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deployment">시험 배포</TabsTrigger>
            <TabsTrigger value="links">접속 링크</TabsTrigger>
            <TabsTrigger value="monitoring">라이브 모니터</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deployment" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    시험 배포 관리
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    학생들에게 시험을 배포하고 진행 상황을 관리합니다.
                  </p>
                  <Button>새 배포 만들기</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="links" className="mt-6">
            <AdminLinks />
          </TabsContent>
          
          <TabsContent value="monitoring" className="mt-6">
            <ProctorMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}