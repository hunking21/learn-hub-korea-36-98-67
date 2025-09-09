import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { localStore, type LegacyDataCandidate, type DataMergeOptions } from '@/store/localStore';
import { toast } from '@/hooks/use-toast';
import {
  Database,
  FileText,
  Users,
  Calendar,
  HelpCircle,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Eye
} from 'lucide-react';

interface DataRecoveryModalProps {
  candidates: LegacyDataCandidate[];
  onClose: () => void;
  onRecoveryComplete: () => void;
}

export function DataRecoveryModal({ candidates, onClose, onRecoveryComplete }: DataRecoveryModalProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<LegacyDataCandidate | null>(
    candidates.length > 0 ? candidates[0] : null
  );
  const [strategy, setStrategy] = useState<'merge' | 'replace'>('merge');
  const [selectedFields, setSelectedFields] = useState<string[]>(['tests', 'attempts']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'tests': return <FileText className="h-4 w-4" />;
      case 'attempts': return <Users className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'assignments': return <Calendar className="h-4 w-4" />;
      case 'questionBank': return <HelpCircle className="h-4 w-4" />;
      case 'scoringProfiles': return <BookOpen className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'tests': return '시험';
      case 'attempts': return '시도 기록';
      case 'users': return '사용자';
      case 'assignments': return '배정';
      case 'questionBank': return '문제은행';
      case 'scoringProfiles': return '채점 프로필';
      default: return field;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('ko-KR');
    } catch {
      return dateStr;
    }
  };

  const handleFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, field]);
    } else {
      setSelectedFields(prev => prev.filter(f => f !== field));
    }
  };

  const handleRecover = async () => {
    if (!selectedCandidate) {
      toast({
        title: "선택 오류",
        description: "복구할 데이터를 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (selectedFields.length === 0) {
      toast({
        title: "선택 오류", 
        description: "복구할 데이터 유형을 하나 이상 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const options: DataMergeOptions = {
        strategy,
        selectedFields
      };

      localStore.mergeLegacyData(selectedCandidate.rawData, options);

      toast({
        title: "복구 완료",
        description: strategy === 'merge' 
          ? `선택한 데이터가 성공적으로 병합되었습니다.`
          : `데이터가 성공적으로 교체되었습니다.`
      });

      onRecoveryComplete();
    } catch (error) {
      console.error('데이터 복구 실패:', error);
      toast({
        title: "복구 실패",
        description: error instanceof Error ? error.message : '데이터 복구에 실패했습니다.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            데이터 복구
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 후보 데이터 선택 */}
          <div>
            <h3 className="font-semibold mb-3">복구할 데이터 선택</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {candidates.map((candidate) => (
                <Card
                  key={candidate.key}
                  className={`cursor-pointer transition-colors ${
                    selectedCandidate?.key === candidate.key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4" />
                          <span className="font-medium">{candidate.key}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(candidate.size)}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {candidate.dataFields.map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {getFieldIcon(field)}
                              <span className="ml-1">{getFieldLabel(field)}</span>
                            </Badge>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {Object.entries(candidate.preview).map(([key, count]) => 
                            count && count > 0 ? (
                              <span key={key}>
                                {getFieldLabel(key)}: {count}개
                              </span>
                            ) : null
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground mt-1">
                          마지막 수정: {formatDate(candidate.lastModified)}
                        </div>
                      </div>
                      
                      {selectedCandidate?.key === candidate.key && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedCandidate && (
            <>
              <Separator />

              {/* 복구 전략 선택 */}
              <div>
                <h3 className="font-semibold mb-3">복구 방식</h3>
                <RadioGroup value={strategy} onValueChange={(value: 'merge' | 'replace') => setStrategy(value)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="flex-1 cursor-pointer">
                      <div className="font-medium">병합 (권장)</div>
                      <div className="text-sm text-muted-foreground">
                        현재 데이터는 유지하고, 누락된 항목만 추가합니다.
                        동일한 ID가 있는 경우 현재 데이터를 우선합니다.
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="flex-1 cursor-pointer">
                      <div className="font-medium text-destructive">교체</div>
                      <div className="text-sm text-muted-foreground">
                        선택한 데이터 유형을 완전히 교체합니다.
                        현재 데이터가 삭제될 수 있습니다.
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 복구할 데이터 유형 선택 */}
              <div>
                <h3 className="font-semibold mb-3">복구할 데이터 유형</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCandidate.dataFields.map((field) => {
                    const count = selectedCandidate.preview[field as keyof typeof selectedCandidate.preview];
                    return (
                      <div key={field} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Checkbox
                          id={field}
                          checked={selectedFields.includes(field)}
                          onCheckedChange={(checked) => handleFieldToggle(field, !!checked)}
                        />
                        <Label htmlFor={field} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            {getFieldIcon(field)}
                            <span className="font-medium">{getFieldLabel(field)}</span>
                            {count && count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {count}개
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {strategy === 'replace' && (
                <Alert className="border-destructive bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>주의:</strong> 선택한 데이터 유형의 현재 데이터가 모두 삭제되고 
                    복구 데이터로 완전히 교체됩니다. 이 작업은 되돌릴 수 없습니다.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            취소
          </Button>
          <Button
            onClick={handleRecover}
            disabled={!selectedCandidate || selectedFields.length === 0 || isProcessing}
            className={strategy === 'replace' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                복구 중...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                {strategy === 'merge' ? '병합하여 복구' : '교체하여 복구'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}