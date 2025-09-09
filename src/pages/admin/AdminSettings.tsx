import React, { useState } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoringConfiguration from './ScoringConfiguration';
import PlacementManagement from './PlacementManagement';
import AdminHealth from './AdminHealth';
import ReleaseChecklist from './ReleaseChecklist';
import ChangelogManagement from './ChangelogManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DataRecoveryBanner } from '@/components/admin/DataRecoveryBanner';
import { AutoBackupManager } from '@/components/admin/AutoBackupManager';
import { 
  Download, 
  Upload, 
  Database, 
  FileText,
  Users,
  BookOpen,
  Calendar,
  HelpCircle,
  Settings,
  Shield,
  Trash2
} from 'lucide-react';
import { localStore } from '@/store/localStore';
import { toast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<string>('');

  // 현재 데이터 통계
  const dataStats = localStore.getDataStats();

  // 백업 파일 다운로드
  const handleExportData = () => {
    try {
      const jsonData = localStore.exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `tn-academy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast({
        title: "백업 완료",
        description: "데이터 백업 파일이 다운로드되었습니다."
      });
    } catch (error) {
      toast({
        title: "백업 실패",
        description: "데이터 내보내기에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "파일 오류",
        description: "JSON 파일만 업로드할 수 있습니다.",
        variant: "destructive"
      });
    }
  };

  // 데이터 복원 처리
  const handleImportData = async () => {
    if (!importData) {
      toast({
        title: "데이터 없음",
        description: "가져올 데이터가 없습니다.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const result = localStore.importData(importData);
      
      if (result.success) {
        toast({
          title: "복원 완료",
          description: result.message
        });
        setImportFile(null);
        setImportData('');
        // 페이지 새로고침으로 최신 데이터 반영
        window.location.reload();
      } else {
        toast({
          title: "복원 실패",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "데이터 가져오기 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">시스템 설정</h1>
          <p className="text-muted-foreground mt-2">
            채점, 배치, 백업, 시스템 관리 설정을 통합 관리하세요.
          </p>
        </div>

        <Tabs defaultValue="scoring" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="scoring">채점 설정</TabsTrigger>
            <TabsTrigger value="placement">배치 권고</TabsTrigger>
            <TabsTrigger value="system">시스템 설정</TabsTrigger>
            <TabsTrigger value="health">헬스 체크</TabsTrigger>
            <TabsTrigger value="changelog">변경 기록</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scoring" className="mt-6">
            <ScoringConfiguration />
          </TabsContent>
          
          <TabsContent value="placement" className="mt-6">
            <PlacementManagement />
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <div className="space-y-6">
              {/* 데이터 복구 배너 */}
              <DataRecoveryBanner />

              <Separator />

              {/* 현재 데이터 현황 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    현재 데이터 현황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{dataStats.testsCount}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />
                        시험
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{dataStats.versionsCount}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        버전
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{dataStats.sectionsCount}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        섹션
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{dataStats.questionsCount}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        문제
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{dataStats.assignmentsCount}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        배정
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{dataStats.attemptsCount}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />
                        시도
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 데이터 백업/복원 */}
              <Card>
                <CardHeader>
                  <CardTitle>데이터 백업 및 복원</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 데이터 내보내기 */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">데이터 내보내기</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      현재 저장된 모든 데이터(시험, 버전, 섹션, 문제, 배정, 시도)를 JSON 파일로 백업합니다.
                    </p>
                    <Button onClick={handleExportData} className="w-full md:w-auto">
                      <Download className="h-4 w-4 mr-2" />
                      데이터 백업 파일 다운로드
                    </Button>
                  </div>

                  <Separator />

                  {/* 데이터 가져오기 */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">데이터 가져오기</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      이전에 백업한 JSON 파일에서 데이터를 복원합니다. 
                      <Badge variant="destructive" className="ml-2">주의: 기존 데이터가 모두 덮어쓰기됩니다</Badge>
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="backup-file">백업 파일 선택</Label>
                        <Input
                          id="backup-file"
                          type="file"
                          accept=".json"
                          onChange={handleFileSelect}
                          className="mt-1"
                        />
                      </div>
                      
                      {importFile && (
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{importFile.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            파일 크기: {(importFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            disabled={!importFile || isImporting} 
                            variant="destructive"
                            className="w-full md:w-auto"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isImporting ? '복원 중...' : '데이터 복원 시작'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>데이터 복원 확인</AlertDialogTitle>
                            <AlertDialogDescription>
                              선택한 백업 파일로부터 데이터를 복원합니다.
                              <br />
                              <strong className="text-destructive">
                                현재 저장된 모든 데이터가 삭제되고 백업 파일의 데이터로 대체됩니다.
                              </strong>
                              <br />
                              이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleImportData}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              복원 실행
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 자동 백업 관리 */}
              <AutoBackupManager />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    일반 설정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">자동 백업</h4>
                        <p className="text-sm text-muted-foreground">매일 자동으로 데이터를 백업합니다</p>
                      </div>
                      <Badge variant="outline">활성화됨</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">시스템 알림</h4>
                        <p className="text-sm text-muted-foreground">중요한 시스템 이벤트를 알림으로 받습니다</p>
                      </div>
                      <Badge variant="outline">활성화됨</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    보안 설정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">이중 인증</h4>
                        <p className="text-sm text-muted-foreground">관리자 계정의 이중 인증을 요구합니다</p>
                      </div>
                      <Badge variant="outline">비활성화됨</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">세션 타임아웃</h4>
                        <p className="text-sm text-muted-foreground">30분 후 자동 로그아웃</p>
                      </div>
                      <Badge variant="outline">30분</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 주의사항 */}
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                <CardHeader>
                  <CardTitle className="text-yellow-800 dark:text-yellow-200">
                    ⚠️ 주의사항
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-yellow-700 dark:text-yellow-300">
                  <ul className="space-y-2 text-sm">
                    <li>• 데이터는 브라우저의 localStorage에 저장되며, 브라우저 데이터 삭제 시 함께 사라집니다.</li>
                    <li>• 자동 백업이 활성화되면 설정된 주기마다 자동으로 백업이 생성됩니다.</li>
                    <li>• 백업은 동일한 브라우저에서만 접근 가능하며, 다른 기기에서는 보이지 않습니다.</li>
                    <li>• 페이지 종료/로그아웃/데이터 초기화 시에도 자동으로 백업이 생성됩니다.</li>
                    <li>• 정기적인 수동 백업 파일 다운로드를 권장합니다.</li>
                    <li>• 백업 파일은 안전한 장소에 보관하세요.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="health" className="mt-6">
            <div className="space-y-6">
              <AdminHealth />
              <ReleaseChecklist />
            </div>
          </TabsContent>
          
          <TabsContent value="changelog" className="mt-6">
            <ChangelogManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}