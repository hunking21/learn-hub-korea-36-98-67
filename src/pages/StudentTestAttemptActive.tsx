import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Save, Send, AlertTriangle, X, CheckCircle, Shield } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';
import { AudioPlayer } from '@/components/AudioPlayer';
import { memoryRepo } from '@/repositories/memoryRepo';
import type { TestAttempt, Test, TestVersion, TestSection, Question } from '@/types';
import { applyTestLayout } from '@/utils/testLayoutGenerator';
import { useExamLockdown } from '@/hooks/useExamLockdown';
import { toast } from 'sonner';

export default function StudentTestAttemptActive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [version, setVersion] = useState<TestVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [recordingStates, setRecordingStates] = useState<Record<string, boolean>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  // Tab switching detection states
  const [violations, setViolations] = useState<Array<{at: string; type: 'blur' | 'visibility' | 'lockdown_violation'; details?: string}>>([]);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const hasShownWarning = useRef(false);

  // Auto-save progress
  const saveProgressRef = useRef<NodeJS.Timeout | null>(null);

  // 잠금 모드 설정
  const isLockdownEnabled = version?.examOptions?.lockdownMode || false;
  const lockdown = useExamLockdown({ 
    enabled: isLockdownEnabled && attempt?.status === 'in_progress',
    attemptId: id 
  });

  useEffect(() => {
    if (id) {
      loadAttemptData();
    }
  }, [id]);

  // Countdown timer with auto-save
  useEffect(() => {
    if (timeLeft > 0 && attempt?.status === 'in_progress') {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
        // Save progress every second
        if (id) {
          memoryRepo.saveResumeProgress(id, currentSectionIndex, currentQuestionIndex, timeLeft - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && attempt?.status === 'in_progress') {
      // Auto-submit when time is up
      handleSubmit();
    }
  }, [timeLeft, attempt?.status, id, currentSectionIndex, currentQuestionIndex]);

  // Tab switching detection
  useEffect(() => {
    if (attempt?.status !== 'in_progress') return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await recordViolation('visibility');
      }
    };

    const handleWindowBlur = async () => {
      await recordViolation('blur');
    };

    const recordViolation = async (type: 'blur' | 'visibility') => {
      if (!id) return;

      try {
        await memoryRepo.recordViolation(id, type);
        
        const newViolation = {
          at: new Date().toISOString(),
          type
        };
        
        setViolations(prev => [...prev, newViolation]);

        // Show warning banner on first violation
        if (!hasShownWarning.current) {
          hasShownWarning.current = true;
          setShowWarningBanner(true);
        }
      } catch (error) {
        console.error('Failed to record violation:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attempt?.status, id]);

  const loadAttemptData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const attemptData = await memoryRepo.getAttempt(id);
      if (!attemptData) {
        toast.error("시험 응시 정보를 찾을 수 없습니다.");
        navigate('/s');
        return;
      }

      if (attemptData.status !== 'in_progress') {
        if (attemptData.status === 'submitted') {
          // 이미 제출된 시험은 결과 페이지로 리다이렉트
          navigate(`/s/result/${id}`);
          return;
        } else {
          toast.error("이미 완료되거나 중단된 시험입니다.");
          navigate('/s');
          return;
        }
      }

      setAttempt(attemptData);
      setAnswers(attemptData.answers || {});
      setViolations(attemptData.violations || []);
      
      // Load existing audio URLs if any
      if (attemptData.audioAnswers) {
        setAudioUrls(attemptData.audioAnswers);
      }

      const tests = await memoryRepo.listTests();
      const testData = tests.find(t => t.id === attemptData.testId);
      if (testData) {
        setTest(testData);
        const versionData = testData.versions?.find(v => v.id === attemptData.versionId);
        if (versionData) {
          // 레이아웃 적용하여 섞인 순서로 문제를 보여줌
          const layoutAppliedVersion = applyTestLayout(versionData, attemptData.layout);
          setVersion(layoutAppliedVersion);
          
          // Calculate total time limit and set countdown
          const totalMinutes = versionData.sections?.reduce((sum, section) => sum + section.timeLimit, 0) || 0;
          const totalSeconds = totalMinutes * 60;
          
          // Calculate elapsed time since start
          const startTime = new Date(attemptData.startedAt).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          
          const remaining = Math.max(0, totalSeconds - elapsedSeconds);
          setTimeLeft(remaining);

          // Check for resume data and restore or set defaults
          if (attemptData.resume) {
            const { sectionIndex, questionIndex, remainingSeconds } = attemptData.resume;
            if (versionData.sections && sectionIndex < versionData.sections.length) {
              setCurrentSectionIndex(sectionIndex);
              setCurrentQuestionIndex(questionIndex);
              setCurrentSectionId(versionData.sections[sectionIndex].id);
              setTimeLeft(Math.min(remaining, remainingSeconds)); // Use the smaller of the two times
              setShowResumeBanner(true);
              // Auto-hide banner after 5 seconds
              setTimeout(() => setShowResumeBanner(false), 5000);
            }
          } else {
            // Set first section as current
            if (versionData.sections && versionData.sections.length > 0) {
              setCurrentSectionIndex(0);
              setCurrentQuestionIndex(0);
              setCurrentSectionId(versionData.sections[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load attempt data:', error);
      toast.error("시험 데이터를 불러오는데 실패했습니다.");
      navigate('/s');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = useCallback(async (questionId: string, response: string) => {
    if (!id) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: response
    }));

    // Save to memory immediately and update progress
    try {
      await memoryRepo.saveAnswer(id, questionId, response);
      await memoryRepo.saveResumeProgress(id, currentSectionIndex, currentQuestionIndex, timeLeft);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  }, [id, currentSectionIndex, currentQuestionIndex, timeLeft]);

  const handleRecordingComplete = async (questionId: string, audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    
    setAudioUrls(prev => ({
      ...prev,
      [questionId]: audioUrl
    }));

    // Save audio URL to memory
    if (id) {
      try {
        await memoryRepo.saveAudioAnswer(id, questionId, audioUrl);
        await handleAnswerChange(questionId, 'recorded');
      } catch (error) {
        console.error('Failed to save audio answer:', error);
      }
    }
  };

  const handleRecordingStateChange = (questionId: string, isRecording: boolean) => {
    setRecordingStates(prev => ({
      ...prev,
      [questionId]: isRecording
    }));
  };

  const handleTempSave = async () => {
    if (!id) return;
    
    try {
      // Answers are already saved on change, just show confirmation
      toast.success("임시저장 완료");
    } catch (error) {
      console.error('Temp save failed:', error);
      toast.error("임시저장에 실패했습니다.");
    }
  };

  const calculateScore = (): { autoTotal: number; maxTotal: number } => {
    if (!version?.sections) return { autoTotal: 0, maxTotal: 0 };

    let autoTotal = 0;
    let maxTotal = 0;

    for (const section of version.sections) {
      if (!section.questions) continue;
      
      for (const question of section.questions) {
        maxTotal += question.points;
        
        const userAnswer = answers[question.id];
        if (!userAnswer) continue;

        if (question.type === 'MCQ' && question.choices && question.answer !== undefined) {
          // MCQ: Check if selected choice index matches correct answer
          const selectedIndex = question.choices.indexOf(userAnswer);
          if (selectedIndex === question.answer) {
            autoTotal += question.points;
          }
        } else if (question.type === 'Short' && question.answer) {
          // Short: Trim and lowercase comparison
          if (userAnswer.trim().toLowerCase() === String(question.answer).toLowerCase()) {
            autoTotal += question.points;
          }
        }
        // Speaking questions don't get auto-graded
      }
    }

    return { autoTotal, maxTotal };
  };

  const handleSubmit = async () => {
    if (!id) return;

    try {
      const { autoTotal, maxTotal } = calculateScore();
      
      await memoryRepo.submitAttempt(id, autoTotal, maxTotal);
      
      toast.success("제출 완료");
      navigate(`/s/result/${id}`);
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error("제출에 실패했습니다.");
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: Question) => {
    const userAnswer = answers[question.id] || '';

    switch (question.type) {
      case 'MCQ':
        return (
          <div className="space-y-4">
            <div className="text-lg font-medium">{question.prompt}</div>
            <RadioGroup
              value={userAnswer}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              className="space-y-3"
            >
              {question.choices?.map((choice, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={choice} id={`q${question.id}-${index}`} />
                  <Label htmlFor={`q${question.id}-${index}`} className="flex-1 cursor-pointer">
                    {choice}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'Short':
        return (
          <div className="space-y-4">
            <div className="text-lg font-medium">{question.prompt}</div>
            <Input
              value={userAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="답안을 입력하세요..."
              className="w-full"
            />
          </div>
        );

      case 'Speaking':
        const isRecording = recordingStates[question.id] || false;
        const audioUrl = audioUrls[question.id];
        
        return (
          <div className="space-y-4">
            <div className="text-lg font-medium">{question.prompt}</div>
            
            <VoiceRecorder
              questionId={question.id}
              isRecording={isRecording}
              setIsRecording={(recording) => handleRecordingStateChange(question.id, recording)}
              onRecordingComplete={(audioBlob) => handleRecordingComplete(question.id, audioBlob)}
              onTranscriptionChange={() => {}} // Not used for speaking questions
              disabled={attempt?.status !== 'in_progress'}
            />
            
            {audioUrl && (
              <AudioPlayer
                audioUrl={audioUrl}
                title={`문제 ${question.id} 답안`}
                showDownload={false}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attempt || !test || !version) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">오류가 발생했습니다</h1>
          <p className="text-muted-foreground">시험 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const sections = version.sections || [];
  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex];

  // Navigation functions
  const handleNextQuestion = async () => {
    if (!currentSection || !id) return;
    
    const nextQuestionIndex = currentQuestionIndex + 1;
    const nextSectionIndex = currentSectionIndex + 1;
    
    if (nextQuestionIndex < (currentSection.questions?.length || 0)) {
      // Next question in same section
      setCurrentQuestionIndex(nextQuestionIndex);
      await memoryRepo.saveResumeProgress(id, currentSectionIndex, nextQuestionIndex, timeLeft);
    } else if (nextSectionIndex < sections.length) {
      // First question of next section
      setCurrentSectionIndex(nextSectionIndex);
      setCurrentQuestionIndex(0);
      setCurrentSectionId(sections[nextSectionIndex].id);
      await memoryRepo.saveResumeProgress(id, nextSectionIndex, 0, timeLeft);
    } else {
      // End of test
      handleSubmit();
    }
  };

  const handlePrevQuestion = async () => {
    if (!id) return;
    
    const prevQuestionIndex = currentQuestionIndex - 1;
    const prevSectionIndex = currentSectionIndex - 1;
    
    if (prevQuestionIndex >= 0) {
      // Previous question in same section
      setCurrentQuestionIndex(prevQuestionIndex);
      await memoryRepo.saveResumeProgress(id, currentSectionIndex, prevQuestionIndex, timeLeft);
    } else if (prevSectionIndex >= 0) {
      // Last question of previous section
      const prevSection = sections[prevSectionIndex];
      const lastQuestionIndex = (prevSection.questions?.length || 1) - 1;
      setCurrentSectionIndex(prevSectionIndex);
      setCurrentQuestionIndex(lastQuestionIndex);
      setCurrentSectionId(prevSection.id);
      await memoryRepo.saveResumeProgress(id, prevSectionIndex, lastQuestionIndex, timeLeft);
    }
  };

  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion = currentSectionIndex === sections.length - 1 && 
    currentQuestionIndex === ((sections[sections.length - 1]?.questions?.length || 1) - 1);
  
  // 뒤로가기 허용 여부 체크
  const allowBacktrack = version?.examOptions?.allowBacktrack !== false; // 기본값 true

  return (
    <div className={`min-h-screen bg-background ${isLockdownEnabled && attempt?.status === 'in_progress' ? 'exam-lockdown-mode' : ''}`}>
      {/* Lockdown Mode Banner */}
      {isLockdownEnabled && attempt?.status === 'in_progress' && (
        <div className="bg-orange-600 text-white px-4 py-3 flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium">
            시험 잠금 모드 활성화됨 - 부정행위 방지 기능이 작동 중입니다
          </span>
          {lockdown.violationCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              위반 {lockdown.violationCount}회
            </Badge>
          )}
        </div>
      )}

      {/* Resume Banner */}
      {showResumeBanner && (
        <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">
              이전 진행 상태에서 재개됨
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResumeBanner(false)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Warning Banner */}
      {showWarningBanner && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              주의: 시험 중 탭 전환이 감지되었습니다. 이런 행위는 부정행위로 간주될 수 있습니다.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWarningBanner(false)}
            className="text-destructive-foreground hover:bg-destructive-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Header with countdown */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{test.name}</h1>
                {violations.length > 3 && (
                  <Badge variant="destructive" className="bg-destructive/90">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    주의: 이탈 {violations.length}회+
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {version.system} {version.grade}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-destructive' : 'text-foreground'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTempSave}>
                  <Save className="h-4 w-4 mr-1" />
                  임시저장
                </Button>
                <Button size="sm" onClick={handleSubmit}>
                  <Send className="h-4 w-4 mr-1" />
                  제출
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Progress indicator */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">진행 상황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sections.map((section, sIndex) => (
                  <div key={section.id} className="space-y-2">
                    <div className={`font-medium ${sIndex === currentSectionIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                      {sIndex + 1}. {section.label || section.type}
                    </div>
                    <div className="flex gap-1">
                      {section.questions?.map((_, qIndex) => (
                        <div
                          key={qIndex}
                          className={`w-3 h-3 rounded-full border ${
                            sIndex === currentSectionIndex && qIndex === currentQuestionIndex
                              ? 'bg-primary border-primary'
                              : sIndex < currentSectionIndex || (sIndex === currentSectionIndex && qIndex < currentQuestionIndex)
                              ? 'bg-primary/50 border-primary/50'
                              : 'bg-muted border-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right area - Current Question */}
          <div className="lg:col-span-3">
            {currentQuestion ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {currentSection?.label || currentSection?.type}
                    </h2>
                    <p className="text-muted-foreground">
                      문제 {currentQuestionIndex + 1} / {currentSection?.questions?.length || 0}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {currentQuestion.points}점
                  </Badge>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    {renderQuestion(currentQuestion)}
                  </CardContent>
                </Card>

                {/* Navigation buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevQuestion}
                    disabled={!allowBacktrack || isFirstQuestion}
                  >
                    ← 이전 문제
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSubmit}>
                      제출하기
                    </Button>
                    <Button onClick={handleNextQuestion}>
                      {isLastQuestion ? '제출하기' : '다음 문제 →'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">문제를 불러오는 중...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};