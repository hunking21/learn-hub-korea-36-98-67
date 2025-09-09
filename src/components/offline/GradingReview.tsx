import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Edit3, Save } from 'lucide-react';
import { toast } from 'sonner';

interface GradingReviewProps {
  extractedAnswers: {
    mcqAnswers: Record<string, number>;
    shortAnswers: Record<string, string>;
    studentInfo: { name: string; studentId: string };
  };
  testData: {
    testId: string;
    versionId: string;
    layoutSeed: number;
    numQuestions: number;
  };
  originalImage?: string | null;
  onGradingComplete: () => void;
  onLog: (message: string) => void;
}

interface ReviewedAnswers {
  mcqAnswers: Record<string, number>;
  shortAnswers: Record<string, string>;
  studentInfo: { name: string; studentId: string };
}

// 임시 정답 데이터 (실제로는 시험 데이터에서 가져와야 함)
const MOCK_CORRECT_ANSWERS = {
  q1: 0, // A
  q2: 2, // C
  q3: 1, // B
  q4: 3, // D
  q5: 0, // A
};

export const GradingReview = ({ 
  extractedAnswers, 
  testData, 
  originalImage, 
  onGradingComplete, 
  onLog 
}: GradingReviewProps) => {
  const [reviewedAnswers, setReviewedAnswers] = useState<ReviewedAnswers>(extractedAnswers);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [autoScore, setAutoScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    calculateScore();
  }, [reviewedAnswers]);

  const calculateScore = () => {
    let correct = 0;
    let total = 0;

    // MCQ 채점
    Object.entries(reviewedAnswers.mcqAnswers).forEach(([questionId, userAnswer]) => {
      total++;
      const correctAnswer = MOCK_CORRECT_ANSWERS[questionId as keyof typeof MOCK_CORRECT_ANSWERS];
      if (correctAnswer !== undefined && userAnswer === correctAnswer) {
        correct++;
      }
    });

    setAutoScore(correct);
    setMaxScore(total);
    onLog(`자동 채점: ${correct}/${total}점`);
  };

  const updateMCQAnswer = (questionId: string, newAnswer: number) => {
    setReviewedAnswers(prev => ({
      ...prev,
      mcqAnswers: {
        ...prev.mcqAnswers,
        [questionId]: newAnswer
      }
    }));
    setEditingQuestion(null);
  };

  const updateShortAnswer = (questionId: string, newAnswer: string) => {
    setReviewedAnswers(prev => ({
      ...prev,
      shortAnswers: {
        ...prev.shortAnswers,
        [questionId]: newAnswer
      }
    }));
  };

  const updateStudentInfo = (field: 'name' | 'studentId', value: string) => {
    setReviewedAnswers(prev => ({
      ...prev,
      studentInfo: {
        ...prev.studentInfo,
        [field]: value
      }
    }));
  };

  const submitGrading = async () => {
    if (!reviewedAnswers.studentInfo.name.trim() || !reviewedAnswers.studentInfo.studentId.trim()) {
      toast.error('학생 이름과 학번을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    onLog('채점 결과 저장 중...');

    try {
      // 실제로는 서버에 저장하지만, 여기서는 로컬 스토리지에 임시 저장
      const attemptData = {
        id: `attempt_${Date.now()}`,
        testId: testData.testId,
        versionId: testData.versionId,
        startedAt: new Date().toISOString(),
        status: 'completed',
        candidate: {
          name: reviewedAnswers.studentInfo.name,
          system: 'KR', // 기본값
          grade: '고등학교 1학년', // 기본값
          note: `오프라인 채점 - 학번: ${reviewedAnswers.studentInfo.studentId}`
        },
        answers: {
          ...Object.entries(reviewedAnswers.mcqAnswers).reduce((acc, [qId, answer]) => {
            acc[qId] = String(answer);
            return acc;
          }, {} as Record<string, string>),
          ...reviewedAnswers.shortAnswers
        },
        submittedAt: new Date().toISOString(),
        autoTotal: autoScore,
        maxTotal: maxScore,
        finalTotal: autoScore,
        layout: {
          seed: testData.layoutSeed
        },
        offlineProcessing: {
          originalImage: originalImage,
          processedAt: new Date().toISOString(),
          extractedAnswers: extractedAnswers,
          reviewedAnswers: reviewedAnswers
        }
      };

      // 로컬 스토리지에 저장
      const existingAttempts = JSON.parse(localStorage.getItem('offlineAttempts') || '[]');
      existingAttempts.push(attemptData);
      localStorage.setItem('offlineAttempts', JSON.stringify(existingAttempts));

      onLog(`채점 완료: ${attemptData.id} 저장됨`);
      toast.success('채점 결과가 저장되었습니다');
      
      setTimeout(() => {
        onGradingComplete();
      }, 1000);

    } catch (error) {
      console.error('채점 저장 실패:', error);
      onLog('채점 저장 중 오류 발생');
      toast.error('채점 저장에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChoiceLetter = (index: number) => String.fromCharCode(65 + index); // 0->A, 1->B, etc.

  const isCorrectAnswer = (questionId: string, userAnswer: number) => {
    const correctAnswer = MOCK_CORRECT_ANSWERS[questionId as keyof typeof MOCK_CORRECT_ANSWERS];
    return correctAnswer !== undefined && userAnswer === correctAnswer;
  };

  return (
    <div className="space-y-6">
      {/* 학생 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">학생 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">이름</Label>
              <Input
                id="studentName"
                value={reviewedAnswers.studentInfo.name}
                onChange={(e) => updateStudentInfo('name', e.target.value)}
                placeholder="학생 이름 입력"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">학번</Label>
              <Input
                id="studentId"
                value={reviewedAnswers.studentInfo.studentId}
                onChange={(e) => updateStudentInfo('studentId', e.target.value)}
                placeholder="학번 입력"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 채점 결과 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>채점 결과</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {autoScore} / {maxScore}
              </Badge>
              <Badge variant={autoScore === maxScore ? "default" : "secondary"}>
                {maxScore > 0 ? Math.round((autoScore / maxScore) * 100) : 0}%
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{autoScore}</div>
              <div className="text-muted-foreground">정답</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{maxScore - autoScore}</div>
              <div className="text-muted-foreground">오답</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{maxScore}</div>
              <div className="text-muted-foreground">총 문항</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 답안 검수 */}
      <Card>
        <CardHeader>
          <CardTitle>답안 검수</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mcq" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mcq">객관식 답안</TabsTrigger>
              <TabsTrigger value="short">주관식 답안</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mcq" className="space-y-4">
              <div className="grid gap-3">
                {Object.entries(reviewedAnswers.mcqAnswers).map(([questionId, userAnswer]) => {
                  const isCorrect = isCorrectAnswer(questionId, userAnswer);
                  const correctAnswer = MOCK_CORRECT_ANSWERS[questionId as keyof typeof MOCK_CORRECT_ANSWERS];
                  
                  return (
                    <div
                      key={questionId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium">{questionId.toUpperCase()}</span>
                        <span>학생 답안: <strong>{getChoiceLetter(userAnswer)}</strong></span>
                        {!isCorrect && correctAnswer !== undefined && (
                          <span className="text-green-600">
                            (정답: <strong>{getChoiceLetter(correctAnswer)}</strong>)
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {editingQuestion === questionId ? (
                          <div className="flex items-center gap-2">
                            {[0, 1, 2, 3, 4].map((choiceIndex) => (
                              <Button
                                key={choiceIndex}
                                size="sm"
                                variant={userAnswer === choiceIndex ? "default" : "outline"}
                                onClick={() => updateMCQAnswer(questionId, choiceIndex)}
                              >
                                {getChoiceLetter(choiceIndex)}
                              </Button>
                            ))}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingQuestion(null)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingQuestion(questionId)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="short" className="space-y-4">
              {Object.keys(reviewedAnswers.shortAnswers).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  주관식 답안이 없습니다
                </div>
              ) : (
                <div className="grid gap-3">
                  {Object.entries(reviewedAnswers.shortAnswers).map(([questionId, answer]) => (
                    <div key={questionId} className="space-y-2">
                      <Label>{questionId.toUpperCase()}</Label>
                      <Input
                        value={answer}
                        onChange={(e) => updateShortAnswer(questionId, e.target.value)}
                        placeholder="답안 입력"
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 원본 이미지 미리보기 */}
      {originalImage && (
        <Card>
          <CardHeader>
            <CardTitle>원본 답안지</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={originalImage} 
              alt="원본 답안지" 
              className="max-w-full h-auto rounded border"
            />
          </CardContent>
        </Card>
      )}

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <Button 
          onClick={submitGrading}
          disabled={isSubmitting}
          size="lg"
          className="px-8"
        >
          {isSubmitting ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              저장 중...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              채점 완료 및 저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
};