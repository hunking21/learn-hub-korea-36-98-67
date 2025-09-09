import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp?: string;
}

export function StudentEditRegressionTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (step: string, status: 'pending' | 'success' | 'error', message: string) => {
    setResults(prev => {
      const newResults = [...prev];
      const existingIndex = newResults.findIndex(r => r.step === step);
      const result = {
        step,
        status,
        message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      if (existingIndex >= 0) {
        newResults[existingIndex] = result;
      } else {
        newResults.push(result);
      }
      
      return newResults;
    });
  };

  const runRegressionTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // 1. Auth 세션 확인
      updateResult('auth', 'pending', '권한 확인 중...');
      const authSession = localStorage.getItem('auth_session_v1');
      
      if (!authSession) {
        updateResult('auth', 'error', '로그인 세션이 없습니다');
        return;
      }
      
      const sessionData = JSON.parse(authSession);
      const now = Date.now();
      
      if (sessionData.expiresAt && now > sessionData.expiresAt) {
        updateResult('auth', 'error', '세션이 만료되었습니다');
        return;
      }
      
      if (sessionData.role !== 'admin') {
        updateResult('auth', 'error', '관리자 권한이 필요합니다');
        return;
      }
      
      updateResult('auth', 'success', '관리자 권한 확인 완료');

      // 2. memoryRepo 접근 테스트
      updateResult('memory_repo', 'pending', 'memoryRepo 접근 중...');
      const { memoryRepo } = await import('@/repositories/memoryRepo');
      updateResult('memory_repo', 'success', 'memoryRepo 접근 성공');

      // 3. 기존 학생 확인
      updateResult('list_students', 'pending', '기존 학생 목록 조회 중...');
      const initialStudents = memoryRepo.users.getStudents();
      updateResult('list_students', 'success', `기존 학생 ${initialStudents.length}명 확인`);

      // 4. 테스트 학생 생성
      updateResult('create_student', 'pending', '테스트 학생 생성 중...');
      const testUsername = `regression_test_${Date.now()}`;
      const testStudent = memoryRepo.users.create({
        username: testUsername,
        password: '1111',
        name: '리그레션테스트학생',
        role: 'STUDENT' as const,
        system: 'KR' as const,
        grade: 'G1',
        phone: '010-0000-0000',
        className: '테스트반',
        birthdate: '2010-01-01',
        gender: 'male' as const,
        isActive: true,
        permissions: {},
        privateNote: '자동 리그레션 테스트 생성'
      });
      updateResult('create_student', 'success', `테스트 학생 생성: ${testStudent.id}`);

      // 5. 학생 정보 수정 테스트
      updateResult('update_student', 'pending', '학생 정보 수정 중...');
      const updatedStudent = memoryRepo.users.update(testStudent.id, {
        name: '수정된리그레션테스트학생',
        className: '수정된테스트반',
        privateNote: '수정된 메모 - 자동 리그레션 테스트',
        grade: 'G2'
      });
      updateResult('update_student', 'success', `학생 정보 수정 완료: ${updatedStudent.name}`);

      // 6. 수정 후 데이터 재조회
      updateResult('refetch_data', 'pending', '수정 후 데이터 재조회 중...');
      const refetchedStudent = memoryRepo.users.getById(testStudent.id);
      
      if (!refetchedStudent) {
        updateResult('refetch_data', 'error', '수정된 학생을 찾을 수 없습니다');
        return;
      }
      
      if (refetchedStudent.name !== '수정된리그레션테스트학생') {
        updateResult('refetch_data', 'error', '이름 수정이 반영되지 않았습니다');
        return;
      }
      
      if (refetchedStudent.grade !== 'G2') {
        updateResult('refetch_data', 'error', '학년 수정이 반영되지 않았습니다');
        return;
      }
      
      updateResult('refetch_data', 'success', '수정된 데이터 재조회 성공');

      // 7. localStorage 지속성 테스트
      updateResult('persistence_test', 'pending', 'localStorage 지속성 테스트 중...');
      const usersData = localStorage.getItem('tn_academy_users');
      
      if (!usersData) {
        updateResult('persistence_test', 'error', 'localStorage에 사용자 데이터가 없습니다');
        return;
      }
      
      const parsedUsers = JSON.parse(usersData);
      const persistedStudent = parsedUsers.find((u: any) => u.id === testStudent.id);
      
      if (!persistedStudent) {
        updateResult('persistence_test', 'error', '생성된 학생이 localStorage에 없습니다');
        return;
      }
      
      if (persistedStudent.name !== '수정된리그레션테스트학생') {
        updateResult('persistence_test', 'error', '수정사항이 localStorage에 반영되지 않았습니다');
        return;
      }
      
      updateResult('persistence_test', 'success', 'localStorage 지속성 확인 완료');

      // 8. 비밀번호 재설정 테스트
      updateResult('reset_password', 'pending', '비밀번호 재설정 테스트 중...');
      const newPassword = memoryRepo.users.resetPassword(testStudent.id);
      
      if (newPassword !== '1111') {
        updateResult('reset_password', 'error', `예상과 다른 비밀번호: ${newPassword}`);
        return;
      }
      
      updateResult('reset_password', 'success', '비밀번호 재설정 성공');

      // 9. 테스트 데이터 정리
      updateResult('cleanup', 'pending', '테스트 데이터 정리 중...');
      memoryRepo.users.remove(testStudent.id);
      
      const finalStudents = memoryRepo.users.getStudents();
      if (finalStudents.some(s => s.id === testStudent.id)) {
        updateResult('cleanup', 'error', '테스트 학생 삭제 실패');
        return;
      }
      
      updateResult('cleanup', 'success', '테스트 데이터 정리 완료');

      toast({
        title: "✅ 리그레션 테스트 통과",
        description: "모든 학생 관리 기능이 정상적으로 작동합니다."
      });

    } catch (error) {
      console.error('리그레션 테스트 실패:', error);
      updateResult('error', 'error', `테스트 실행 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      
      toast({
        title: "❌ 리그레션 테스트 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">성공</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">실패</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">진행중</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          학생 편집 자동 리그레션 테스트
        </CardTitle>
        <CardDescription>
          학생 생성→수정→저장→재조회→새로고침 지속성까지 전체 플로우를 자동으로 검증합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runRegressionTest}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              테스트 실행 중...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              리그레션 테스트 실행
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">테스트 결과:</h4>
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="text-sm font-medium">{result.step}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                    {result.timestamp && (
                      <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {results.length > 0 && !isRunning && (
              <div className="mt-4 p-3 rounded bg-muted">
                <p className="text-xs text-muted-foreground">
                  마지막 결과: {results[results.length - 1]?.message}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}