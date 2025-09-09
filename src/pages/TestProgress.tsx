import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import VideoRecorder from "@/components/VideoRecorder";
import AppLayout from "@/components/layout/AppLayout";
import { ReadingTest } from "@/components/reading/ReadingTest";
import { useReadingPassages } from "@/hooks/useReadingPassages";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string;
  points: number;
}

interface TestSession {
  id: string;
  session_key: string;
  total_questions: number;
  current_question_index: number;
  total_score: number;
  max_possible_score: number;
}

const useQuery = () => new URLSearchParams(useLocation().search);

const TestProgress = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const system = query.get("system");
  const grade = query.get("grade");
  const exam = query.get("exam");
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [session, setSession] = useState<TestSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30분
  const [showResult, setShowResult] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  
  // Reading passages hook with relaxed filters as fallback
  const { data: readingPassages = [] } = useReadingPassages({
    grade: grade || undefined
  });

  // Fallback query without subject filter if no passages found
  const { data: fallbackPassages = [] } = useReadingPassages({
    grade: grade || undefined
  });

  useEffect(() => {
    if (system && grade && exam) {
      if (exam === 'English Reading') {
        // Try primary passages first, then fallback passages
        const availablePassages = readingPassages.length > 0 ? readingPassages : fallbackPassages;
        
        if (availablePassages.length > 0) {
          setSelectedPassageId(availablePassages[0].id);
        }
        setLoading(false);
      } else if (exam !== 'English Reading') {
        initializeTest();
      }
    }
  }, [system, grade, exam, readingPassages, fallbackPassages]);

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      finishTest();
    }
  }, [timeLeft, showResult]);

  const generateSessionKey = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const initializeTest = async () => {
    try {
      setLoading(true);
      
      // Create mock questions for testing
      const tempQuestions: Question[] = [
        {
          id: "1",
          question_text: exam === 'Math' ? "5 + 3은 얼마인가요?" : 
                        exam === 'English Reading' ? "다음 중 'cat'과 운율이 맞는 단어는?" :
                        exam === 'English Writing' ? "좋아하는 동물에 대해 2-3문장으로 써보세요." :
                        "좋아하는 음식에 대해 30초 동안 말해보세요.",
          question_type: exam === 'English Writing' ? 'essay' as const : 
                        exam === 'Speaking' ? 'speaking' as const : 'multiple_choice' as const,
          options: exam === 'Math' ? ["6", "7", "8", "9"] :
                  exam === 'English Reading' ? ["dog", "hat", "car", "big"] :
                  null,
          correct_answer: exam === 'Math' ? "8" : 
                         exam === 'English Reading' ? "hat" : "",
          explanation: exam === 'Math' ? "5와 3을 더하면 8입니다." :
                      exam === 'English Reading' ? "hat과 cat은 운율이 맞습니다." :
                      "창작 문제입니다.",
          points: 2
        },
        {
          id: "2",
          question_text: exam === 'Math' ? "삼각형의 변은 몇 개인가요?" :
                        exam === 'English Reading' ? "'The sun is bright'에서 태양을 설명하는 단어는?" :
                        exam === 'English Writing' ? "어제 한 일에 대해 영어로 써보세요." :
                        "가족에 대해 소개해주세요.",
          question_type: exam === 'Math' ? 'short_answer' as const :
                        exam === 'English Writing' ? 'essay' as const :
                        exam === 'Speaking' ? 'speaking' as const : 'multiple_choice' as const,
          options: exam === 'English Reading' ? ["colorful", "bright", "small", "cold"] : null,
          correct_answer: exam === 'Math' ? "3" :
                         exam === 'English Reading' ? "bright" : "",
          explanation: exam === 'Math' ? "삼각형은 3개의 변을 가집니다." :
                      exam === 'English Reading' ? "문장에서 'bright'라고 했습니다." :
                      "표현 연습 문제입니다.",
          points: 2
        }
      ];
      
      setQuestions(tempQuestions);
      setAnswers(new Array(tempQuestions.length).fill(""));
      
      // Create temporary session
      const tempSession: TestSession = {
        id: "temp_session",
        session_key: generateSessionKey(),
        total_questions: tempQuestions.length,
        current_question_index: 0,
        total_score: 0,
        max_possible_score: tempQuestions.reduce((sum, q) => sum + q.points, 0)
      };
      
      setSession(tempSession);
      setLoading(false);
      
    } catch (error) {
      console.error('테스트 초기화 오류:', error);
      toast({
        title: "오류 발생",
        description: "테스트를 시작할 수 없습니다.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedAnswer;
      setAnswers(newAnswers);
      
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setSelectedAnswer(newAnswers[prevIndex] || "");
      setIsRecording(false);
      setVideoBlob(null);
    }
  };

  useEffect(() => {
    if (answers.length > 0 && currentQuestionIndex < answers.length) {
      setSelectedAnswer(answers[currentQuestionIndex] || "");
    }
  }, [currentQuestionIndex, answers]);

  const submitAnswer = async () => {
    if (!session) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.question_type === 'speaking') {
      if (!videoBlob && !selectedAnswer) return;
    } else {
      if (!selectedAnswer) return;
    }

    const isCorrect = currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'short_answer' 
      ? selectedAnswer === currentQuestion.correct_answer 
      : null;

    try {
      const newScore = session.total_score + (isCorrect ? currentQuestion.points : 0);
      const newIndex = currentQuestionIndex + 1;
      
      setSession({
        ...session,
        current_question_index: newIndex,
        total_score: newScore
      });

      if (newIndex >= questions.length) {
        finishTest();
      } else {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = selectedAnswer;
        setAnswers(newAnswers);
        
        setCurrentQuestionIndex(newIndex);
        setSelectedAnswer(newAnswers[newIndex] || "");
        setIsRecording(false);
        setVideoBlob(null);
      }

    } catch (error) {
      console.error('답안 제출 오류:', error);
      toast({
        title: "오류 발생",
        description: "답안 제출에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const finishTest = async () => {
    if (!session) return;

    try {
      const percentage = (session.total_score / session.max_possible_score) * 100;
      const gradeRating = 
        percentage >= 90 ? 'A+' :
        percentage >= 80 ? 'A' :
        percentage >= 70 ? 'B+' :
        percentage >= 60 ? 'B' :
        percentage >= 50 ? 'C+' :
        percentage >= 40 ? 'C' : 'F';

      if (['Math', 'English Reading', 'English Writing', 'Speaking'].includes(exam || '')) {
        const storageKey = `diagnostic_results_${system}_${grade}`;
        const existingResults = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const filteredResults = existingResults.filter((r: any) => r.subject !== exam);
        const newResult = {
          subject: exam,
          score: session.total_score,
          maxScore: session.max_possible_score,
          grade: gradeRating,
          completedAt: new Date().toISOString()
        };
        
        filteredResults.push(newResult);
        localStorage.setItem(storageKey, JSON.stringify(filteredResults));
      }

      setShowResult(true);

    } catch (error) {
      console.error('테스트 완료 처리 오류:', error);
    }
  };

  const handleRecordingComplete = (blob: Blob) => {
    setVideoBlob(blob);
    setSelectedAnswer("비디오 답안이 녹화되었습니다.");
  };

  const handleTranscriptionChange = (text: string) => {
    setSelectedAnswer(text);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">테스트를 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">테스트 완료!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {session?.total_score} / {session?.max_possible_score}
            </div>
            <div className="text-lg">
              정답률: {session ? Math.round((session.total_score / session.max_possible_score) * 100) : 0}%
            </div>
            <Button onClick={() => navigate(`/diagnostic/select?system=${encodeURIComponent(system!)}&grade=${encodeURIComponent(grade!)}`)} className="mt-6">
              진단고사 메뉴로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Reading 테스트인 경우 처리
  if (exam === 'English Reading') {
    if (!selectedPassageId) {
      return (
        <AppLayout
          title="리딩 테스트"
          subtitle="테스트에 사용할 지문을 찾을 수 없습니다"
        >
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-4">사용 가능한 리딩 지문이 없습니다</h2>
            <p className="text-muted-foreground mb-8">
              선택한 시스템과 학년에 해당하는 리딩 지문이 없습니다.
            </p>
            <Button onClick={() => navigate(-1)}>
              이전으로 돌아가기
            </Button>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout
        title="리딩 테스트"
        subtitle={`${system} ${grade}학년 - 영어 독해`}
      >
        <ReadingTest
          passageId={selectedPassageId}
          onComplete={(sessionId) => {
            toast({
              title: "테스트 완료!",
              description: "리딩 테스트가 성공적으로 완료되었습니다.",
            });
            navigate('/dashboard');
          }}
        />
      </AppLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p>문제를 불러올 수 없습니다.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            이전으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{system} {grade}학년 - {exam}</h1>
          <div className="text-lg font-semibold text-primary">
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>문제 {currentQuestionIndex + 1} / {questions.length}</span>
          <span>{session && Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% 완료</span>
        </div>
        
        <Progress value={session ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0} className="h-2" />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            <span className="text-lg">문제 {currentQuestionIndex + 1}</span>
            <span className="text-sm text-muted-foreground">{currentQuestion.points}점</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-base leading-relaxed">
            {currentQuestion.question_text}
          </div>

          {/* Answer Input */}
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    selectedAnswer === option
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAnswer(option)}
                >
                  {index + 1}. {option}
                </button>
              ))}
            </div>
          )}

          {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
            <Textarea
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder={currentQuestion.question_type === 'essay' ? "상세한 답안을 작성해주세요..." : "답안을 입력해주세요..."}
              className={currentQuestion.question_type === 'essay' ? "min-h-[200px]" : "min-h-[100px]"}
            />
          )}

          {currentQuestion.question_type === 'speaking' && (
            <div className="space-y-4">
              <VideoRecorder
                onRecordingComplete={handleRecordingComplete}
                onTranscriptionChange={handleTranscriptionChange}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
              />
              
              {videoBlob && (
                <div className="text-sm text-muted-foreground">
                  ✓ 비디오 답안이 녹화되었습니다.
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              이전 문제
            </Button>
            
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">시험 종료</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>시험을 종료하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      아직 답변하지 않은 문제가 있을 수 있습니다. 정말로 시험을 종료하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>계속하기</AlertDialogCancel>
                    <AlertDialogAction onClick={finishTest}>
                      시험 종료
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="min-w-[100px]"
              >
                {currentQuestionIndex === questions.length - 1 ? "시험 완료" : "다음 문제"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestProgress;