import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, BookOpen, CheckCircle, AlertCircle } from "lucide-react";

interface TestMaster {
  id: string;
  name: string;
  description: string | null;
  time_limit_minutes: number | null;
}

interface TestVersion {
  id: string;
  grade_level: string;
  system_type: string;
  time_limit_minutes: number | null;
}

interface TestSection {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  time_limit_minutes: number | null;
  score_weight: number;
}

interface TestQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

interface TestData {
  master: TestMaster;
  version: TestVersion;
  sections: (TestSection & { questions: TestQuestion[] })[];
}

const AdminTest = () => {
  const { masterId, versionId, sectionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const loadTestData = async () => {
    try {
      setIsLoading(true);

      // Load test master
      const { data: masterData, error: masterError } = await supabase
        .from('test_masters')
        .select('*')
        .eq('id', masterId)
        .single();

      if (masterError) throw masterError;

      // Load test version
      const { data: versionData, error: versionError } = await supabase
        .from('test_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Load sections with questions
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('test_sections')
        .select(`
          *,
          test_section_questions(*)
        `)
        .eq('version_id', versionId)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      const sectionsWithQuestions = sectionsData.map(section => ({
        ...section,
        questions: (section.test_section_questions || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      setTestData({
        master: masterData,
        version: versionData,
        sections: sectionsWithQuestions
      });

      // Set initial timer if there's a time limit
      const timeLimit = versionData.time_limit_minutes || masterData.time_limit_minutes;
      if (timeLimit) {
        setTimeRemaining(timeLimit * 60); // Convert to seconds
      }

    } catch (error) {
      console.error('Error loading test data:', error);
      toast({
        title: "오류",
        description: "테스트 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
      navigate('/test/select');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (masterId && versionId) {
      loadTestData();
    }
  }, [masterId, versionId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0 && !isCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, isCompleted]);

  const currentSection = testData?.sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = testData?.sections.reduce((total, section) => total + section.questions.length, 0) || 0;
  const answeredQuestions = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (!currentSection || !testData) return;

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < testData.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = testData?.sections[currentSectionIndex - 1];
      if (prevSection) {
        setCurrentQuestionIndex(prevSection.questions.length - 1);
      }
    }
  };

  const handleSubmit = async () => {
    if (!testData) return;

    try {
      // Calculate score
      let totalScore = 0;
      let maxScore = 0;

      testData.sections.forEach(section => {
        section.questions.forEach(question => {
          maxScore += question.points;
          const userAnswer = answers[question.id];
          if (userAnswer === question.correct_answer) {
            totalScore += question.points;
          }
        });
      });

      setIsCompleted(true);

      toast({
        title: "테스트 완료!",
        description: `점수: ${totalScore}/${maxScore}점 (${Math.round((totalScore / maxScore) * 100)}%)`,
      });

      // Here you could save the results to the database
      // For now, we'll just show the results

    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: "오류",
        description: "테스트 제출 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <AppLayout title="테스트 로딩 중..." subtitle="잠시만 기다려주세요">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">테스트를 준비하고 있습니다...</p>
        </div>
      </AppLayout>
    );
  }

  if (!testData || !currentSection || !currentQuestion) {
    return (
      <AppLayout title="테스트를 찾을 수 없습니다" subtitle="">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">테스트를 불러올 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            요청한 테스트를 찾을 수 없거나 접근 권한이 없습니다.
          </p>
          <Button onClick={() => navigate('/test/select')}>
            테스트 선택으로 돌아가기
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isCompleted) {
    return (
      <AppLayout title="테스트 완료" subtitle="수고하셨습니다!">
        <div className="max-w-2xl mx-auto text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">테스트가 완료되었습니다!</h2>
          <p className="text-muted-foreground mb-8">
            모든 문제를 완료하셨습니다. 결과는 곧 확인하실 수 있습니다.
          </p>
          <div className="space-y-4">
            <Button onClick={() => navigate('/test/select')} size="lg">
              다른 테스트 보기
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} size="lg">
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`${testData.master.name} - ${currentSection.name}`}
      subtitle={`${testData.version.system_type}제 ${testData.version.grade_level}`}
      showBackButton={false}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress and Timer */}
        <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">진행률:</span>
              <span className="ml-2">{answeredQuestions}/{totalQuestions}</span>
            </div>
            <Progress value={progress} className="w-32" />
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

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  문제 {currentQuestionIndex + 1}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentSection.name} • {currentQuestion.points}점
                </p>
              </div>
              <Badge>{currentQuestion.question_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Text */}
            <div className="prose max-w-none">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* Answer Options */}
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <label 
                    key={key}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={key}
                      checked={answers[currentQuestion.id] === key}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{key})</span>
                      <span className="ml-2">{String(value)}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'short_answer' && (
              <div>
                <textarea
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="답안을 입력하세요..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
              </div>
            )}
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
            <Button variant="outline" onClick={handleSubmit}>
              제출하기
            </Button>
            <Button onClick={handleNext}>
              {(currentSectionIndex === testData.sections.length - 1 && 
                currentQuestionIndex === currentSection.questions.length - 1) 
                ? '완료' : '다음 문제 →'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminTest;