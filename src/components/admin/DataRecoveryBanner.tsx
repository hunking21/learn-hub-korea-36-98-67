import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataRecoveryModal } from './DataRecoveryModal';
import { localStore, type LegacyDataCandidate } from '@/store/localStore';
import { toast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Database, 
  FileX, 
  RefreshCw,
  X 
} from 'lucide-react';

export function DataRecoveryBanner() {
  const [candidates, setCandidates] = useState<LegacyDataCandidate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 이미 해제된 경우 스캔하지 않음
    const dismissed = localStorage.getItem('data_recovery_banner_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    scanForLegacyData();
  }, []);

  const scanForLegacyData = () => {
    setIsScanning(true);
    try {
      const found = localStore.scanLegacyData();
      // 현재 메인 스토어 키는 제외
      const filtered = found.filter(c => c.key !== 'app_store_v1');
      setCandidates(filtered);
    } catch (error) {
      console.error('레거시 데이터 스캔 실패:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('data_recovery_banner_dismissed', new Date().toISOString());
  };

  const resetDismissState = () => {
    setIsDismissed(false);
    localStorage.removeItem('data_recovery_banner_dismissed');
    scanForLegacyData();
  };

  // 해제되었거나 스캔 중이면 표시하지 않음
  if (isDismissed) {
    return (
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetDismissState}
          className="text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          데이터 복구 재검사
        </Button>
      </div>
    );
  }

  if (isScanning) {
    return (
      <Alert className="mb-6">
        <Database className="h-4 w-4 animate-spin" />
        <AlertDescription>
          이전 데이터를 검사하고 있습니다...
        </AlertDescription>
      </Alert>
    );
  }

  // 데이터가 없으면 안내 메시지만 표시
  if (candidates.length === 0) {
    return (
      <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <FileX className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          이전 데이터를 찾을 수 없습니다. 백업 JSON 파일이 있다면 아래 <strong>데이터 가져오기</strong> 기능을 이용하세요.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  이전 데이터 감지됨
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {candidates.length}개 후보
                </Badge>
              </div>
              
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-4">
                브라우저에서 복구 가능한 이전 데이터가 발견되었습니다. 
                데이터를 미리보기하고 현재 데이터와 병합하거나 교체할 수 있습니다.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {candidates.slice(0, 3).map((candidate) => (
                  <Badge key={candidate.key} variant="outline" className="text-xs">
                    {candidate.key} ({candidate.dataFields.join(', ')})
                  </Badge>
                ))}
                {candidates.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{candidates.length - 3}개 더
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowModal(true)}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  미리보기 및 복구
                </Button>
                <Button 
                  onClick={handleDismiss}
                  variant="outline" 
                  size="sm"
                >
                  나중에
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-amber-600 hover:text-amber-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <DataRecoveryModal
          candidates={candidates}
          onClose={() => setShowModal(false)}
          onRecoveryComplete={() => {
            setShowModal(false);
            handleDismiss();
          }}
        />
      )}
    </>
  );
}