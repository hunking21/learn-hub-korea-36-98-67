import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import PreflightCheck from "@/components/PreflightCheck";
import { tokenManager, type AssignmentToken } from "@/utils/tokenUtils";
import { memoryRepo } from "@/repositories/memoryRepo";
import { localStore } from "@/store/localStore";
import { useToast } from "@/hooks/use-toast";
import type { Test, TestAssignment, TestAttempt } from "@/types";
import { Clock, User, BookOpen, AlertTriangle, CheckCircle, Play } from "lucide-react";

interface StudentInfo {
  name: string;
  studentId: string;
  grade?: string;
  class?: string;
}

export default function StudentTokenAccess() {
  const { token: urlToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [token, setToken] = useState<AssignmentToken | null>(null);
  const [assignment, setAssignment] = useState<TestAssignment | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    name: "",
    studentId: "",
    grade: "",
    class: ""
  });
  const [isInfoValid, setIsInfoValid] = useState(false);
  const [showPreflightCheck, setShowPreflightCheck] = useState(false);
  const [preflightPassed, setPreflightPassed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    validateToken();
  }, [urlToken]);

  useEffect(() => {
    // Validate student info
    const isValid = studentInfo.name.trim().length > 0 && studentInfo.studentId.trim().length > 0;
    setIsInfoValid(isValid);
  }, [studentInfo]);

  const validateToken = async () => {
    if (!urlToken) {
      setError("토큰이 제공되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const validation = tokenManager.validateToken(urlToken);
      if (!validation.isValid) {
        setError(validation.error || "유효하지 않은 토큰입니다.");
        setIsLoading(false);
        return;
      }

      if (!validation.token) {
        setError("토큰 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setToken(validation.token);

      // Load assignment and test data
      const tests = await memoryRepo.listTests();
      const foundTest = tests.find(t => t.id === validation.token!.testId);
      
      if (!foundTest) {
        setError("시험 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      const foundAssignment = foundTest.assignments?.find(a => a.id === validation.token!.assignmentId);
      if (!foundAssignment) {
        setError("배포 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setTest(foundTest);
      setAssignment(foundAssignment);
      
      // Mark token as used
      tokenManager.useToken(urlToken);
      
    } catch (error) {
      console.error('Token validation error:', error);
      setError("토큰 검증 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!token || !assignment || !test || !isInfoValid || !preflightPassed) return;

    setIsStarting(true);

    try {
      // Create test attempt
      const attemptId = crypto.randomUUID();
      const attempt: TestAttempt = {
        id: attemptId,
        testId: test.id,
        versionId: token.versionId,
        candidate: {
          name: studentInfo.name,
          system: assignment.system,
          grade: assignment.grades?.[0] || 'Unknown',
          note: `Student ID: ${studentInfo.studentId}${studentInfo.class ? `, Class: ${studentInfo.class}` : ''} | Assignment: ${assignment.id} | Token: ${token.value}`
        },
        startedAt: new Date().toISOString(),
        status: 'in_progress'
      };

      localStore.addAttempt(attempt);

      toast({
        title: "시험 시작",
        description: "시험이 시작되었습니다. 화이팅!",
      });

      // Navigate to test attempt page
      navigate(`/s/attempt/${attemptId}/active`);
      
    } catch (error) {
      console.error('Failed to start test:', error);
      toast({
        title: "오류",
        description: "시험 시작에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">토큰을 확인하는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              접속 오류
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => navigate('/')}
            >
              메인페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !assignment || !test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">시험 정보를 불러올 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">TN Academy</h1>
            <p className="text-muted-foreground">온라인 시험 시스템</p>
          </div>

          {/* Test Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {test.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">배포 시스템:</span>
                  <p className="font-medium">{assignment.system}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">토큰:</span>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{token.value}</p>
                </div>
              </div>

              {test.description && (
                <div>
                  <span className="text-muted-foreground text-sm">시험 설명:</span>
                  <p className="mt-1">{test.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>토큰 생성: {formatDate(token.issuedAt)}</span>
                {token.usageCount > 0 && (
                  <>
                    <span>•</span>
                    <span>사용 횟수: {token.usageCount}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student Information */}
          {!showPreflightCheck && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  응시자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={studentInfo.name}
                      onChange={(e) => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentId">학번 *</Label>
                    <Input
                      id="studentId"
                      value={studentInfo.studentId}
                      onChange={(e) => setStudentInfo(prev => ({ ...prev, studentId: e.target.value }))}
                      placeholder="2024001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade">학년</Label>
                    <Input
                      id="grade"
                      value={studentInfo.grade}
                      onChange={(e) => setStudentInfo(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">반</Label>
                    <Input
                      id="class"
                      value={studentInfo.class}
                      onChange={(e) => setStudentInfo(prev => ({ ...prev, class: e.target.value }))}
                      placeholder="A"
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => setShowPreflightCheck(true)}
                  disabled={!isInfoValid}
                >
                  다음 단계
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Preflight Check */}
          {showPreflightCheck && !preflightPassed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  장치 점검
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PreflightCheck 
                  testName={test.name}
                  onComplete={(result) => {
                    setPreflightPassed(true);
                    toast({
                      title: "장치 점검 완료",
                      description: "모든 점검 항목을 통과했습니다.",
                    });
                  }}
                />
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPreflightCheck(false)}
                  >
                    이전으로
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Test */}
          {showPreflightCheck && preflightPassed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  시험 시작 준비 완료
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">응시자 정보</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>이름: {studentInfo.name}</span>
                    <span>학번: {studentInfo.studentId}</span>
                    {studentInfo.grade && <span>학년: {studentInfo.grade}</span>}
                    {studentInfo.class && <span>반: {studentInfo.class}</span>}
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    시험이 시작되면 페이지를 새로고침하거나 닫지 마세요. 
                    시험 중 문제가 발생하면 즉시 담당자에게 문의하세요.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setPreflightPassed(false)}
                  >
                    이전으로
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleStartTest}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        시험 시작 중...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        시험 시작
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}