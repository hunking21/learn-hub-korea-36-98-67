import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, User, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { resultTokenManager, StudentTestAttempt } from '@/utils/resultTokenUtils';
import { format } from 'date-fns';

export default function ParentResultView() {
  const { token } = useParams<{ token: string }>();
  const [attempt, setAttempt] = useState<StudentTestAttempt | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('토큰이 제공되지 않았습니다.');
      setLoading(false);
      return;
    }

    const tokenValidation = resultTokenManager.validateToken(token);
    if (!tokenValidation.isValid) {
      setError(tokenValidation.error || '유효하지 않은 토큰입니다.');
      setLoading(false);
      return;
    }

    const attemptData = resultTokenManager.getAttemptByToken(token);
    if (!attemptData) {
      setError('시험 결과를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    setAttempt(attemptData);
    setLoading(false);
  }, [token]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">접근할 수 없습니다</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              올바른 링크인지 확인하시거나 담당 교사에게 문의해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-2xl font-bold">시험 결과표</h1>
          </div>
          <p className="text-primary-foreground/80">
            TN Academy - 학습 성과 확인
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                학생 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">학생명</p>
                  <p className="font-medium">{attempt.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">시험일시</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(attempt.completedAt), 'yyyy년 MM월 dd일 HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                시험 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">{attempt.testName}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">획득 점수</p>
                  <p className="text-3xl font-bold text-primary">
                    {attempt.score}
                  </p>
                  <p className="text-sm text-muted-foreground">/ {attempt.maxScore}점</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">백분율</p>
                  <p className="text-3xl font-bold text-primary">
                    {attempt.percentage}%
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">등급</p>
                  <Badge 
                    className={`text-lg px-3 py-1 font-bold ${getGradeColor(attempt.percentage)}`}
                    variant="secondary"
                  >
                    {attempt.grade}
                  </Badge>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">전체 성취도</span>
                  <span className="text-sm font-medium">{attempt.percentage}%</span>
                </div>
                <Progress value={attempt.percentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Section Breakdown */}
          {attempt.sections && attempt.sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  영역별 상세 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attempt.sections.map((section, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{section.name}</h4>
                          <Badge variant="outline">
                            {section.score}/{section.maxScore}점
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">
                          {section.percentage}%
                        </span>
                      </div>
                      <Progress value={section.percentage} className="h-2" />
                      {index < attempt.sections!.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>학습 성과 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempt.percentage >= 90 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>우수한 성과입니다!</strong> 매우 잘 이해하고 있으며, 지속적인 학습으로 더욱 발전할 수 있습니다.
                    </AlertDescription>
                  </Alert>
                )}
                
                {attempt.percentage >= 70 && attempt.percentage < 90 && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>양호한 성과입니다!</strong> 기본 개념을 잘 이해하고 있습니다. 부족한 영역을 보완하면 더 좋은 결과를 얻을 수 있습니다.
                    </AlertDescription>
                  </Alert>
                )}
                
                {attempt.percentage < 70 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>추가 학습이 필요합니다.</strong> 기본 개념 복습과 함께 부족한 영역을 집중적으로 학습하시길 권합니다.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <p>
                    <strong>참고사항:</strong> 이 결과표는 학습 진도 파악을 위한 자료입니다. 
                    자세한 학습 계획이나 상담이 필요하시면 담당 교사에게 문의해주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>TN Academy | 이 결과표는 보안이 적용된 개인정보입니다.</p>
            <p className="mt-1">
              만료일: {format(new Date(attempt.resultToken!.expiresAt), 'yyyy년 MM월 dd일')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}