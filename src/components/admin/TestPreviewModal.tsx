import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, BookOpen, X } from "lucide-react";
import type { Test, TestVersion } from "@/types";
import { generatePreviewLayout } from "@/utils/testLayoutGenerator";

interface TestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test | null;
}

export const TestPreviewModal = ({ isOpen, onClose, test }: TestPreviewModalProps) => {
  const [selectedVersion, setSelectedVersion] = useState<TestVersion | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // 테스트가 변경될 때 첫 번째 버전을 기본 선택
  useEffect(() => {
    if (test && test.versions && test.versions.length > 0) {
      // 미리보기용 고정 시드로 레이아웃 적용
      const layoutAppliedVersion = generatePreviewLayout(test.versions[0]);
      setSelectedVersion(layoutAppliedVersion);
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);
      
      // 타이머 설정 (데모용으로 30분 고정)
      setTimeRemaining(30 * 60); // 30분
    }
  }, [test]);

  // 데모 타이머 (실제로는 시간이 흐르지 않음)
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev ? Math.max(0, prev - 1) : 0);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const handleVersionChange = (versionId: string) => {
    const version = test?.versions?.find(v => v.id === versionId);
    if (version) {
      // 미리보기용 고정 시드로 레이아웃 적용
      const layoutAppliedVersion = generatePreviewLayout(version);
      setSelectedVersion(layoutAppliedVersion);
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);
    }
  };

  const handleNext = () => {
    if (!selectedVersion) return;

    const currentSection = selectedVersion.sections?.[currentSectionIndex];
    if (!currentSection) return;

    if (currentQuestionIndex < (currentSection.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < (selectedVersion.sections?.length || 0) - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = selectedVersion?.sections?.[currentSectionIndex - 1];
      if (prevSection) {
        setCurrentQuestionIndex((prevSection.questions?.length || 1) - 1);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!test || !selectedVersion) {
    return null;
  }

  const currentSection = selectedVersion.sections?.[currentSectionIndex];
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex];
  const totalQuestions = selectedVersion.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0;
  const currentQuestionNumber = selectedVersion.sections
    ?.slice(0, currentSectionIndex)
    .reduce((total, section) => total + (section.questions?.length || 0), 0) + currentQuestionIndex + 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{test.name} - 미리보기</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                읽기 전용 미리보기 모드입니다
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 버전 선택 드롭다운 */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">버전 선택:</label>
            <Select value={selectedVersion.id} onValueChange={handleVersionChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {test.versions?.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {version.system} {version.grade}학년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress and Timer */}
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">진행률:</span>
                <span className="ml-2">{currentQuestionNumber}/{totalQuestions}</span>
              </div>
              <Progress value={(currentQuestionNumber / totalQuestions) * 100} className="w-32" />
            </div>
            
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 300 ? 'text-destructive font-medium' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          {currentSection && currentQuestion ? (
            <>
              {/* Question Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        문제 {currentQuestionNumber}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentSection.type} • {currentQuestion.points}점
                      </p>
                    </div>
                    <Badge>{currentQuestion.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Text */}
                  <div className="prose max-w-none">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {currentQuestion.prompt}
                    </p>
                  </div>

                  {/* Answer Options - Read Only */}
                  {currentQuestion.type === 'MCQ' && currentQuestion.choices && (
                    <div className="space-y-3">
                      {currentQuestion.choices.map((choice, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20"
                        >
                          <div className="w-4 h-4 border border-muted-foreground/30 rounded-full mt-1 bg-background"></div>
                          <div className="flex-1">
                            <span className="font-medium">{String.fromCharCode(65 + index)})</span>
                            <span className="ml-2">{choice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'Short' && (
                    <div>
                      <div className="w-full p-3 border rounded-lg bg-muted/20 text-muted-foreground">
                        답안 입력란 (미리보기 모드에서는 비활성화)
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'Speaking' && (
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg bg-muted/20 text-center">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          음성 녹음 영역 (미리보기 모드에서는 비활성화)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      📋 이는 미리보기 모드입니다. 실제 응시에서는 답안 입력 및 제출이 가능합니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                >
                  ← 이전 문제
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" disabled>
                    제출하기 (비활성화)
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={
                      currentSectionIndex === (selectedVersion.sections?.length || 0) - 1 && 
                      currentQuestionIndex === ((currentSection.questions?.length || 0) - 1)
                    }
                  >
                    {(currentSectionIndex === (selectedVersion.sections?.length || 0) - 1 && 
                      currentQuestionIndex === ((currentSection.questions?.length || 0) - 1)) 
                      ? '완료' : '다음 문제 →'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                선택된 버전에 문제가 없습니다.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};