import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Clock } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function TeacherDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">선생님 대시보드</h1>
          <p className="text-muted-foreground">담당 학생들의 학습 현황을 확인하세요</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">담당 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">
                +3 이번 달
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중인 테스트</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                2개 마감 임박
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">82.3</div>
              <p className="text-xs text-muted-foreground">
                +5.2% 지난 주 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">미채점 답안</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                주관식 답안
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>최근 제출된 답안</CardTitle>
              <CardDescription>채점이 필요한 주관식 답안들</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">김철수 - 국어 독해</p>
                    <p className="text-xs text-muted-foreground">2024-01-15 14:30</p>
                  </div>
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    채점 대기
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">이영희 - 수학 서술형</p>
                    <p className="text-xs text-muted-foreground">2024-01-15 13:45</p>
                  </div>
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    채점 대기
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">박민수 - 영어 에세이</p>
                    <p className="text-xs text-muted-foreground">2024-01-15 12:20</p>
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    채점 완료
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>학습 진도 현황</CardTitle>
              <CardDescription>이번 주 학생별 진도율</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">김철수 (3학년)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <span className="text-xs">85%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">이영희 (2학년)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <span className="text-xs">92%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">박민수 (4학년)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '67%'}}></div>
                    </div>
                    <span className="text-xs">67%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">최서연 (1학년)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                    <span className="text-xs">78%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}