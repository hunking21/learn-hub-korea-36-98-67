import React from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAnalytics from './AdminAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, BarChart3, Users, FileCheck } from "lucide-react";

export default function ReviewResults() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">리뷰·결과 관리</h1>
          <p className="text-muted-foreground mt-2">
            교사 리뷰 승인, 자동 채점 검토, 결과 분석을 관리하세요.
          </p>
        </div>

        <Tabs defaultValue="review" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="review">교사 리뷰</TabsTrigger>
            <TabsTrigger value="analytics">결과 분석</TabsTrigger>
          </TabsList>
          
          <TabsContent value="review" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    루브릭 승인 대기
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    교사가 제출한 주관식 채점을 검토하고 승인합니다.
                  </p>
                  <Button>대기 중인 리뷰 보기</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    자동 채점 검토
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    AI 자동 채점 결과를 검토하고 수정합니다.
                  </p>
                  <Button>자동 채점 결과 보기</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}