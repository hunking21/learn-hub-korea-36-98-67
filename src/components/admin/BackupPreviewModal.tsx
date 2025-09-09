import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BackupItem } from '@/store/localStore';
import {
  FileText,
  Users,
  HelpCircle,
  BookOpen,
  RotateCcw,
  Trash2,
  Database,
  Clock,
  HardDrive,
  AlertTriangle
} from 'lucide-react';

interface BackupPreviewModalProps {
  backup: BackupItem;
  onClose: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export function BackupPreviewModal({ backup, onClose, onRestore, onDelete }: BackupPreviewModalProps) {
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('ko-KR');
    } catch {
      return isoString;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getDataStats = () => {
    const { data } = backup;
    return {
      versions: data.tests?.reduce((sum, test) => sum + (test.versions?.length || 0), 0) || 0,
      sections: data.tests?.reduce((sum, test) => 
        sum + (test.versions?.reduce((vSum, version) => 
          vSum + (version.sections?.length || 0), 0) || 0), 0) || 0,
      questions: data.tests?.reduce((sum, test) => 
        sum + (test.versions?.reduce((vSum, version) => 
          vSum + (version.sections?.reduce((sSum, section) => 
            sSum + (section.questions?.length || 0), 0) || 0), 0) || 0), 0) || 0,
      assignments: data.tests?.reduce((sum, test) => sum + (test.assignments?.length || 0), 0) || 0
    };
  };

  const stats = getDataStats();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            백업 미리보기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 백업 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">백업 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">생성 시간:</span>
                  <span className="font-medium">{formatDate(backup.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">크기:</span>
                  <Badge variant="outline">{formatFileSize(backup.size)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">버전:</span>
                  <Badge variant="secondary">{backup.data.version}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">키:</span>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{backup.key}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 데이터 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">포함된 데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{backup.dataPreview.tests}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <FileText className="h-3 w-3" />
                    시험
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.versions}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    버전
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.sections}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    섹션
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.questions}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    문제
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.assignments}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    배정
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{backup.dataPreview.attempts}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    시도
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-cyan-600">{backup.dataPreview.questionBank}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    문제은행
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{backup.dataPreview.scoringProfiles}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    채점설정
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주의사항 */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>복원 시 주의사항:</strong>
              <br />
              • 현재 저장된 모든 데이터가 이 백업의 데이터로 완전히 교체됩니다.
              <br />
              • 복원 후에는 페이지가 새로고침되어 변경사항이 즉시 반영됩니다.
              <br />
              • 복원 작업은 되돌릴 수 없으니 신중하게 결정하세요.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            삭제
          </Button>
          <Button
            onClick={onRestore}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            복원
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}