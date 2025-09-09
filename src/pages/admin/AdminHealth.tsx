import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Play, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { memoryRepo } from '@/repositories/memoryRepo';
import { validateTestForPublishing } from '@/utils/testValidation';
import { localStore } from '@/store/localStore';
import type { Test, TestAttempt, TestAssignment } from '@/types';

interface HealthCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail';
  message: string;
  details?: string;
}

interface E2EReport {
  success: boolean;
  steps: Array<{
    step: string;
    status: 'pass' | 'fail';
    message: string;
  }>;
  generatedData?: {
    testId?: string;
    attemptId?: string;
    assignmentId?: string;
  };
}

export default function AdminHealth() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningE2E, setIsRunningE2E] = useState(false);
  const [e2eReport, setE2eReport] = useState<E2EReport | null>(null);

  const runHealthChecks = async () => {
    setIsLoading(true);
    const checks: HealthCheck[] = [];

    try {
      // 1. 시험 수 > 0
      const tests = await memoryRepo.listTests();
      checks.push({
        id: 'tests-exist',
        name: '시험 존재',
        status: tests.length > 0 ? 'pass' : 'fail',
        message: tests.length > 0 ? `${tests.length}개의 시험이 존재합니다` : '시험이 존재하지 않습니다',
        details: tests.length === 0 ? '최소 1개의 시험을 생성해야 합니다' : undefined
      });

      // 2. Published 시험 수 > 0
      const publishedTests = tests.filter(test => test.status === 'Published');
      checks.push({
        id: 'published-tests',
        name: '발행된 시험',
        status: publishedTests.length > 0 ? 'pass' : 'fail',
        message: publishedTests.length > 0 ? `${publishedTests.length}개의 발행된 시험이 존재합니다` : '발행된 시험이 없습니다',
        details: publishedTests.length === 0 ? '최소 1개의 시험을 발행해야 합니다' : undefined
      });

      // 3. 모든 Published 시험 유효성 검증
      let validPublishedTests = 0;
      let invalidTestDetails: string[] = [];
      
      for (const test of publishedTests) {
        const validation = validateTestForPublishing(test);
        if (validation.isValid) {
          validPublishedTests++;
        } else {
          invalidTestDetails.push(`${test.name}: ${validation.errors.join(', ')}`);
        }
      }

      checks.push({
        id: 'published-tests-valid',
        name: '발행된 시험 유효성',
        status: publishedTests.length > 0 && validPublishedTests === publishedTests.length ? 'pass' : 'fail',
        message: publishedTests.length > 0 ? 
          `${validPublishedTests}/${publishedTests.length}개의 발행된 시험이 유효합니다` : 
          '발행된 시험이 없습니다',
        details: invalidTestDetails.length > 0 ? invalidTestDetails.join('\n') : undefined
      });

      // 4. assignments 존재 및 기간 유효
      const now = new Date();
      let totalAssignments = 0;
      let validAssignments = 0;
      let assignmentDetails: string[] = [];

      for (const test of publishedTests) {
        if (test.assignments) {
          totalAssignments += test.assignments.length;
          for (const assignment of test.assignments) {
            const startAt = new Date(assignment.startAt);
            const endAt = new Date(assignment.endAt);
            if (startAt <= now && now <= endAt) {
              validAssignments++;
            } else {
              assignmentDetails.push(`${test.name} - ${assignment.system} ${assignment.grades.join(',')}: 기간 만료 또는 미시작`);
            }
          }
        }
      }

      checks.push({
        id: 'assignments',
        name: '할당 및 기간',
        status: totalAssignments > 0 && validAssignments > 0 ? 'pass' : 'fail',
        message: totalAssignments > 0 ? 
          `${validAssignments}/${totalAssignments}개의 할당이 유효한 기간입니다` : 
          '할당이 존재하지 않습니다',
        details: assignmentDetails.length > 0 ? assignmentDetails.join('\n') : 
          totalAssignments === 0 ? '시험에 할당을 추가해야 합니다' : undefined
      });

      // 5. 제출된 attempts ≥ 1
      const attempts = await memoryRepo.getAllAttempts();
      const submittedAttempts = attempts.filter(attempt => attempt.status === 'submitted');
      checks.push({
        id: 'submitted-attempts',
        name: '제출된 응시',
        status: submittedAttempts.length > 0 ? 'pass' : 'fail',
        message: submittedAttempts.length > 0 ? 
          `${submittedAttempts.length}개의 제출된 응시가 있습니다` : 
          '제출된 응시가 없습니다',
        details: submittedAttempts.length === 0 ? '학생이 시험을 완료하고 제출해야 합니다' : undefined
      });

      // 6. 교사 리뷰 완료 attempts ≥ 1
      const reviewedAttempts = attempts.filter(attempt => attempt.reviewStatus === 'completed');
      checks.push({
        id: 'reviewed-attempts',
        name: '리뷰 완료된 응시',
        status: reviewedAttempts.length > 0 ? 'pass' : 'fail',
        message: reviewedAttempts.length > 0 ? 
          `${reviewedAttempts.length}개의 리뷰 완료된 응시가 있습니다` : 
          '리뷰 완료된 응시가 없습니다',
        details: reviewedAttempts.length === 0 ? '교사가 Speaking 응시를 리뷰해야 합니다' : undefined
      });

      setHealthChecks(checks);
    } catch (error) {
      console.error('Health check failed:', error);
      checks.push({
        id: 'error',
        name: '시스템 오류',
        status: 'fail',
        message: '헬스 체크 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      });
      setHealthChecks(checks);
    } finally {
      setIsLoading(false);
    }
  };

  const runE2ETest = async () => {
    setIsRunningE2E(true);
    const report: E2EReport = {
      success: true,
      steps: []
    };
    const generatedData: any = {};

    try {
      // Step 1: Create test
      report.steps.push({
        step: '시험 생성',
        status: 'pass',
        message: 'E2E 테스트용 시험을 생성합니다'
      });

      const test = await memoryRepo.createTest({
        name: 'E2E Test - ' + new Date().toISOString(),
        description: 'End-to-end test generated test'
      });
      generatedData.testId = test.id;

      // Step 2: Add version
      await memoryRepo.addVersion(test.id, { targets: [{ system: 'KR', grades: ['중1'] }] });
      const updatedTest = (await memoryRepo.listTests()).find(t => t.id === test.id)!;
      const version = updatedTest.versions![0];

      report.steps.push({
        step: '버전 추가',
        status: 'pass',
        message: 'KR 중1 버전을 추가했습니다'
      });

      // Step 3: Add section with questions
      await memoryRepo.addSection(test.id, version.id, { label: 'Reading', type: 'Reading', timeLimit: 30 });
      const testWithSection = (await memoryRepo.listTests()).find(t => t.id === test.id)!;
      const section = testWithSection.versions![0].sections![0];

      // Add questions
      await memoryRepo.addQuestion(test.id, version.id, section.id, {
        type: 'MCQ',
        prompt: 'E2E Test Question 1',
        choices: ['A', 'B', 'C', 'D'],
        answer: 0,
        points: 10
      });

      await memoryRepo.addQuestion(test.id, version.id, section.id, {
        type: 'Speaking',
        prompt: 'E2E Speaking Question',
        points: 20
      });

      report.steps.push({
        step: '섹션 및 문항 추가',
        status: 'pass',
        message: 'Reading 섹션과 2개 문항을 추가했습니다'
      });

      // Step 4: Publish test
      await memoryRepo.updateTestStatus(test.id, 'Published');

      report.steps.push({
        step: '시험 발행',
        status: 'pass',
        message: '시험을 발행했습니다'
      });

      // Step 5: Add assignment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await memoryRepo.addAssignment(test.id, {
        system: 'KR',
        grades: ['중1'],
        startAt: yesterday.toISOString(),
        endAt: tomorrow.toISOString()
      });

      report.steps.push({
        step: '할당 추가',
        status: 'pass',
        message: '유효한 기간의 할당을 추가했습니다'
      });

      // Step 6: Create and submit attempt
      const attempt = await memoryRepo.createAttempt(test.id, version.id);
      generatedData.attemptId = attempt.id;

      // Answer questions
      const finalTest = (await memoryRepo.listTests()).find(t => t.id === test.id)!;
      const questions = finalTest.versions![0].sections![0].questions!;
      
      await memoryRepo.saveAnswer(attempt.id, questions[0].id, '0');
      await memoryRepo.saveAudioAnswer(attempt.id, questions[1].id, 'blob:mock-audio-url');
      await memoryRepo.submitAttempt(attempt.id, 10, 30);

      report.steps.push({
        step: '응시 및 제출',
        status: 'pass',
        message: '응시를 생성하고 답안을 제출했습니다'
      });

      // Step 7: Review attempt
      await memoryRepo.reviewAttempt(attempt.id, [{
        questionId: questions[1].id,
        manualScore: 15,
        comment: 'E2E test review'
      }]);

      report.steps.push({
        step: '교사 리뷰',
        status: 'pass',
        message: 'Speaking 답안을 리뷰했습니다'
      });

      report.generatedData = generatedData;

    } catch (error) {
      console.error('E2E test failed:', error);
      report.success = false;
      report.steps.push({
        step: '오류 발생',
        status: 'fail',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }

    setE2eReport(report);
    setIsRunningE2E(false);
    
    // Refresh health checks after E2E test
    await runHealthChecks();
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const overallStatus = healthChecks.length > 0 && healthChecks.every(check => check.status === 'pass') ? 'pass' : 'fail';

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">시스템 상태</h1>
            <p className="text-muted-foreground">메모리 스토어 상태를 모니터링합니다</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={runE2ETest}
              disabled={isRunningE2E}
              className="gap-2"
            >
              {isRunningE2E ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              빠른 E2E 실행
            </Button>
            <Button 
              variant="outline" 
              onClick={runHealthChecks}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              새로고침
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {overallStatus === 'pass' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              전체 상태
              <Badge variant={overallStatus === 'pass' ? 'default' : 'destructive'}>
                {overallStatus === 'pass' ? 'HEALTHY' : 'ISSUES'}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Health Checks */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">상태 점검</h2>
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>상태를 확인하는 중...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            healthChecks.map((check) => (
              <Card key={check.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {check.status === 'pass' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {check.name}
                    </span>
                    <Badge variant={check.status === 'pass' ? 'default' : 'destructive'}>
                      {check.status === 'pass' ? 'PASS' : 'FAIL'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{check.message}</CardDescription>
                </CardHeader>
                {check.details && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {check.details}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* E2E Test Report */}
        {e2eReport && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">E2E 테스트 결과</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {e2eReport.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  전체 플로우 테스트
                  <Badge variant={e2eReport.success ? 'default' : 'destructive'}>
                    {e2eReport.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {e2eReport.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {step.status === 'pass' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{step.step}:</span>
                      <span>{step.message}</span>
                    </div>
                  ))}
                  
                  {e2eReport.generatedData && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">생성된 데이터</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {e2eReport.generatedData.testId && (
                          <div>시험 ID: {e2eReport.generatedData.testId}</div>
                        )}
                        {e2eReport.generatedData.attemptId && (
                          <div>응시 ID: {e2eReport.generatedData.attemptId}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}