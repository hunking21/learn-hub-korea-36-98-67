import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';
import { useReleaseChecklist } from '@/hooks/useReleaseChecklist';
import { generateReleaseReport } from '@/utils/releaseReportGenerator';
import { useToast } from '@/hooks/use-toast';
import { RecentChanges } from '@/components/admin/RecentChanges';

export default function ReleaseChecklist() {
  const { checklist, loading, refetch } = useReleaseChecklist();
  const { toast } = useToast();
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      await generateReleaseReport(checklist);
      toast({
        title: "리포트 생성 완료",
        description: "Go/No-Go 리포트가 PDF로 다운로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "리포트 생성 실패",
        description: "PDF 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const overallStatus = checklist.every(item => item.status === 'pass');

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">출시 체크리스트</h1>
            <p className="text-muted-foreground">
              시스템 출시 준비 상태를 자동으로 점검합니다
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {generatingReport ? '생성 중...' : 'Go/No-Go 리포트 생성 (PDF)'}
            </Button>
          </div>
        </div>

        {/* 전체 상태 카드 */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {overallStatus ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              전체 시스템 상태
              <Badge
                variant={overallStatus ? 'default' : 'destructive'}
                className={overallStatus ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
              >
                {overallStatus ? 'GO' : 'NO-GO'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overallStatus
                ? '모든 출시 조건을 만족합니다. 시스템 출시 준비가 완료되었습니다.'
                : '일부 출시 조건이 미충족 상태입니다. 빨간색 항목을 확인해 주세요.'}
            </p>
          </CardContent>
        </Card>

        {/* Recent Changes Panel */}
        <RecentChanges limit={5} />

        {/* 체크리스트 항목들 */}
        <div className="grid gap-4">
          {checklist.map((item, index) => (
            <Card key={index} className={`border-l-4 ${
              item.status === 'pass' ? 'border-l-green-500' : 
              item.status === 'fail' ? 'border-l-red-500' : 'border-l-yellow-500'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                  </span>
                  {item.status === 'pass' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : item.status === 'fail' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />
                  )}
                  {item.title}
                  <Badge
                    variant={
                      item.status === 'pass' ? 'default' : 
                      item.status === 'fail' ? 'destructive' : 'secondary'
                    }
                    className={item.status === 'pass' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                  >
                    {item.status === 'pass' ? '통과' : 
                     item.status === 'fail' ? '실패' : '검사중'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                {item.details && (
                  <div className="text-sm">
                    <strong>세부 정보:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {item.details.map((detail, i) => (
                        <li key={i} className={
                          item.status === 'pass' ? 'text-green-700' : 
                          item.status === 'fail' ? 'text-red-700' : 'text-muted-foreground'
                        }>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      <strong>오류:</strong> {item.error}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}