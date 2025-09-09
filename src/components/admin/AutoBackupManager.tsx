import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BackupPreviewModal } from './BackupPreviewModal';
import { localStore, type AutoBackupSettings, type BackupItem } from '@/store/localStore';
import { toast } from '@/hooks/use-toast';
import {
  Clock,
  HardDrive,
  Download,
  RotateCcw,
  Trash2,
  Eye,
  Archive,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function AutoBackupManager() {
  const [settings, setSettings] = useState<AutoBackupSettings>(localStore.getAutoBackupSettings());
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    const backupList = localStore.getBackupList();
    setBackups(backupList);
  };

  const handleSettingsChange = (newSettings: Partial<AutoBackupSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStore.updateAutoBackupSettings(updated);
    
    toast({
      title: "설정 저장됨",
      description: `자동 백업이 ${updated.enabled ? '활성화' : '비활성화'}되었습니다.`
    });
  };

  const handleCreateBackup = () => {
    const success = localStore.createBackup();
    if (success) {
      loadBackups();
      toast({
        title: "백업 생성 완료",
        description: "현재 데이터가 백업되었습니다."
      });
    } else {
      toast({
        title: "백업 생성 실패",
        description: "이미 최근에 백업이 생성되었거나 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleRestore = (backup: BackupItem) => {
    const success = localStore.restoreFromBackup(backup.key);
    if (success) {
      loadBackups();
      toast({
        title: "복원 완료",
        description: `${formatDate(backup.timestamp)} 백업이 복원되었습니다.`
      });
      // 페이지 새로고침으로 변경사항 반영
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast({
        title: "복원 실패",
        description: "백업 복원 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (backup: BackupItem) => {
    const success = localStore.deleteBackup(backup.key);
    if (success) {
      loadBackups();
      toast({
        title: "백업 삭제됨",
        description: `${formatDate(backup.timestamp)} 백업이 삭제되었습니다.`
      });
    } else {
      toast({
        title: "삭제 실패",
        description: "백업 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const blob = await localStore.exportBackupsAsZip();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tn-academy-backups-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "내보내기 완료",
        description: "모든 백업이 파일로 내보내졌습니다."
      });
    } catch (error) {
      toast({
        title: "내보내기 실패",
        description: "백업 내보내기 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

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

  const getIntervalLabel = (interval: string) => {
    const labels = {
      '10min': '10분마다',
      '1hour': '1시간마다',
      '1day': '1일마다'
    };
    return labels[interval as keyof typeof labels] || interval;
  };

  return (
    <div className="space-y-6">
      {/* 자동 백업 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            자동 백업 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>자동 백업 활성화</Label>
              <p className="text-sm text-muted-foreground">
                설정된 주기에 따라 자동으로 데이터를 백업합니다.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => handleSettingsChange({ enabled })}
            />
          </div>

          {settings.enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>백업 주기</Label>
                  <Select
                    value={settings.interval}
                    onValueChange={(interval: '10min' | '1hour' | '1day') => handleSettingsChange({ interval })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10min">10분마다</SelectItem>
                      <SelectItem value="1hour">1시간마다</SelectItem>
                      <SelectItem value="1day">1일마다</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>최대 보관 개수</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxBackups}
                    onChange={(e) => handleSettingsChange({ maxBackups: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  자동 백업이 활성화되었습니다. {getIntervalLabel(settings.interval)} 백업이 생성되며, 
                  최대 {settings.maxBackups}개까지 보관됩니다.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* 백업 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              백업 관리
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateBackup} size="sm">
                <Clock className="h-4 w-4 mr-1" />
                수동 백업
              </Button>
              <Button
                onClick={handleExportAll}
                variant="outline"
                size="sm"
                disabled={backups.length === 0 || isExporting}
              >
                <Archive className="h-4 w-4 mr-1" />
                {isExporting ? '내보내는 중...' : '전체 내보내기'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                아직 생성된 백업이 없습니다. 수동 백업을 생성하거나 자동 백업을 활성화하세요.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{formatDate(backup.timestamp)}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(backup.size)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>시험: {backup.dataPreview.tests}개</span>
                      <span>시도: {backup.dataPreview.attempts}개</span>
                      <span>문제은행: {backup.dataPreview.questionBank}개</span>
                      <span>채점설정: {backup.dataPreview.scoringProfiles}개</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowPreview(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRestore(backup)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(backup)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 백업 미리보기 모달 */}
      {showPreview && selectedBackup && (
        <BackupPreviewModal
          backup={selectedBackup}
          onClose={() => {
            setShowPreview(false);
            setSelectedBackup(null);
          }}
          onRestore={() => {
            handleRestore(selectedBackup);
            setShowPreview(false);
            setSelectedBackup(null);
          }}
          onDelete={() => {
            handleDelete(selectedBackup);
            setShowPreview(false);
            setSelectedBackup(null);
          }}
        />
      )}
    </div>
  );
}