import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useReadingPassage } from "@/hooks/useReadingPassages";
import { useReadingQuestions, ReadingQuestion } from "@/hooks/useReadingQuestions";
import { 
  useCreateReadingTestSession, 
  useUpdateReadingTestSession, 
  useSubmitReadingAnswer 
} from "@/hooks/useReadingTestSession";
import { toast } from "sonner";

interface ReadingTestProps {
  passageId: string;
  onComplete?: (sessionId: string) => void;
}

export const ReadingTest = ({ passageId, onComplete }: ReadingTestProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showPassage, setShowPassage] = useState(true);

  const { data: passage } = useReadingPassage(passageId);
  const { data: questions = [] } = useReadingQuestions(passageId);
  const createSession = useCreateReadingTestSession();
  const updateSession = useUpdateReadingTestSession();
  const submitAnswer = useSubmitReadingAnswer();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (passage && questions.length > 0 && !sessionId) {
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      
      createSession.mutate({
        passage_id: passageId,
        total_questions: questions.length,
        max_possible_score: totalPoints,
      }, {
        onSuccess: (session) => {
          setSessionId(session.id);
        },
        onError: (error) => {
          console.error("세션 생성 오류:", error);
          toast.error("테스트 세션을 생성할 수 없습니다.");
        },
      });
    }
  }, [passage, questions, sessionId]);

  const handleAnswerChange = (value: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = async () => {
    if (!currentQuestion || !sessionId) return;

    const userAnswer = answers[currentQuestion.id] || "";
    let isCorrect: boolean | undefined;
    let score = 0;

    // 객관식과 주관식은 자동 채점, 서술형은 수동 채점 필요
    if (currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'short_answer') {
      isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.correct_answer?.toLowerCase();
      score = isCorrect ? currentQuestion.points : 0;
    } else {
      // 서술형은 일단 점수 0으로 저장 (나중에 수동 채점)
      isCorrect = undefined;
      score = 0;
    }

    try {
      await submitAnswer.mutateAsync({
        session_id: sessionId,
        question_id: currentQuestion.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        score: score,
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // 테스트 완료
        await updateSession.mutateAsync({
          sessionId,
          status: 'completed',
          completed_at: new Date().toISOString()
        });
        
        toast.success("테스트가 완료되었습니다!");
        onComplete?.(sessionId);
      }
    } catch (error) {
      console.error("답안 제출 오류:", error);
      toast.error("답안을 제출할 수 없습니다.");
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.question_type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'short_answer':
        return (
          <Textarea
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="답안을 입력하세요..."
            className="min-h-[100px]"
          />
        );

      case 'essay':
        return (
          <Textarea
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="서술형 답안을 작성하세요..."
            className="min-h-[200px]"
          />
        );

      default:
        return null;
    }
  };

  if (!passage || questions.length === 0) {
    return <div className="text-center p-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>문제 {currentQuestionIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress)}% 완료</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 지문 */}
        <Card className={showPassage ? "" : "lg:hidden"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">{passage.title}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPassage(!showPassage)}
              className="lg:hidden"
            >
              {showPassage ? "문제 보기" : "지문 보기"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {passage.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 문제 */}
        <Card className={!showPassage ? "" : "lg:block hidden"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                문제 {currentQuestionIndex + 1}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {currentQuestion?.points}점
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPassage(!showPassage)}
              className="lg:hidden w-fit"
            >
              지문 보기
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-base leading-relaxed">
              {currentQuestion?.question_text}
            </div>

            {renderQuestionInput()}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                이전
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion?.id || ""]}
              >
                {currentQuestionIndex === questions.length - 1 ? "완료" : "다음"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};