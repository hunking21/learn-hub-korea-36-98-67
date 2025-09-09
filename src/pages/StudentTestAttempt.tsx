import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle } from 'lucide-react';
import { memoryRepo } from '@/repositories/memoryRepo';
import type { TestAttempt, Test, TestVersion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CandidateInfoModal } from '@/components/CandidateInfoModal';
import PreflightCheck from '@/components/PreflightCheck';

export default function StudentTestAttempt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [version, setVersion] = useState<TestVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadAttemptData();
    }
  }, [id]);

  const loadAttemptData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load attempt
      const attemptData = await memoryRepo.getAttempt(id);
      if (!attemptData) {
        toast({
          title: "오류",
          description: "시험 응시 정보를 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }
      setAttempt(attemptData);

      // Load test and version data
      const tests = await memoryRepo.listTests();
      const testData = tests.find(t => t.id === attemptData.testId);
      if (testData) {
        setTest(testData);
        const versionData = testData.versions?.find(v => v.id === attemptData.versionId);
        if (versionData) {
          setVersion(versionData);
        }
      }

      // Check preflight status first
      if (!attemptData.preflight) {
        setShowPreflight(true);
        return;
      }

      // Check if candidate info is needed
      if (!attemptData.candidate) {
        setShowCandidateModal(true);
      }
    } catch (error) {
      console.error('Failed to load attempt data:', error);
      toast({
        title: "오류",
        description: "시험 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreflightComplete = async (preflightResult: any) => {
    if (!id) return;

    try {
      await memoryRepo.savePreflightResults(id, preflightResult);
      // Reload attempt data to get updated info
      await loadAttemptData();
      setShowPreflight(false);
      toast({
        title: "장치 점검 완료",
        description: "이제 응시자 정보를 입력해주세요.",
      });
    } catch (error) {
      console.error('Failed to save preflight results:', error);
      toast({
        title: "오류",
        description: "장치 점검 결과 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCandidateInfoSubmit = async (candidateInfo: TestAttempt['candidate']) => {
    if (!id || !candidateInfo) return;

    try {
      const success = await memoryRepo.updateCandidateInfo(id, candidateInfo);
      if (success) {
        // Reload attempt data to get updated info
        await loadAttemptData();
        setShowCandidateModal(false);
        toast({
          title: "응시자 정보 저장 완료",
          description: "이제 시험을 시작할 수 있습니다.",
        });
      } else {
        throw new Error("Failed to update candidate info");
      }
    } catch (error) {
      console.error('Failed to save candidate info:', error);
      toast({
        title: "오류",
        description: "응시자 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleStartTest = () => {
    if (!id) return;
    navigate(`/s/attempt/${id}/active`);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attempt || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">오류가 발생했습니다</h1>
          <p className="text-muted-foreground">시험 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // Show preflight check if not completed
  if (showPreflight) {
    return (
      <PreflightCheck
        testName={test.name}
        onComplete={handlePreflightComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{test.name}</h1>
            <p className="text-muted-foreground">
              {version ? `${version.system} ${version.grade}` : '시험 버전'}
            </p>
          </div>

          {/* Preflight Status */}
          {attempt.preflight && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  장치 점검 완료
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={attempt.preflight.mic ? "default" : "destructive"}>
                      {attempt.preflight.mic ? "통과" : "실패"}
                    </Badge>
                    <span>마이크</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={attempt.preflight.record ? "default" : "destructive"}>
                      {attempt.preflight.record ? "통과" : "실패"}
                    </Badge>
                    <span>녹음</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={attempt.preflight.play ? "default" : "destructive"}>
                      {attempt.preflight.play ? "통과" : "실패"}
                    </Badge>
                    <span>재생</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {attempt.preflight.net.downKbps}KB/s
                    </Badge>
                    <span>네트워크</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ... keep existing code (attempt info, test sections, etc.) */}
          
          {/* Attempt Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>응시 정보</span>
                <Badge 
                  variant={
                    attempt.status === 'in_progress' ? 'default' : 
                    attempt.status === 'completed' ? 'secondary' : 'outline'
                  }
                  className={
                    attempt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    attempt.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
                  }
                >
                  {attempt.status === 'in_progress' ? '응시 중' : 
                   attempt.status === 'completed' ? '완료됨' : '중단됨'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    시작 시간: {formatTime(attempt.startedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    응시 ID: {attempt.id.slice(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Candidate Info Display */}
              {attempt.candidate && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">응시자 정보</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>이름: {attempt.candidate.name}</div>
                    <div>학제/학년: {attempt.candidate.system} {attempt.candidate.grade}</div>
                    {attempt.candidate.phone && <div>연락처: {attempt.candidate.phone}</div>}
                    {attempt.candidate.note && <div>메모: {attempt.candidate.note}</div>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Sections */}
          {version?.sections && version.sections.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>시험 구성</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {version.sections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {index + 1}. {section.label || section.type}
                        </h3>
                        <Badge variant="outline">
                          {section.timeLimit}분
                        </Badge>
                      </div>
                      {section.questions && (
                        <p className="text-sm text-muted-foreground">
                          문항 수: {section.questions.length}개
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="text-center">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    모든 준비가 완료되었습니다. 시험을 시작하세요.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => window.history.back()}>
                      돌아가기
                    </Button>
                    {attempt.status === 'in_progress' && attempt.candidate && attempt.preflight && (
                      <Button onClick={handleStartTest}>
                        시험 시작
                      </Button>
                    )}
                    {attempt.status === 'in_progress' && !attempt.candidate && (
                      <Button disabled>
                        응시자 정보 입력 필요
                      </Button>
                    )}
                    {attempt.status === 'in_progress' && !attempt.preflight && (
                      <Button disabled>
                        장치 점검 필요
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Candidate Info Modal */}
          <CandidateInfoModal
            isOpen={showCandidateModal}
            onSubmit={handleCandidateInfoSubmit}
            testName={test.name}
          />
        </div>
      </div>
    </div>
  );
}