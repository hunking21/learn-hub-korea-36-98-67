import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, ArrowLeft, Trophy, Download } from 'lucide-react';
import { memoryRepo } from '@/repositories/memoryRepo';
import type { TestAttempt, Test, TestVersion, TestSection, Question } from '@/types';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { PlacementRecommendationCard } from '@/components/PlacementRecommendation';
import { usePlacementConfig } from '@/hooks/usePlacementConfig';
import { placementUtils } from '@/utils/placementUtils';
import { toast } from 'sonner';

interface SectionResult {
  section: TestSection;
  totalQuestions: number;
  totalPoints: number;
  earnedPoints: number;
  correctAnswers: number;
  incorrectAnswers: number;
  pendingReview: number;
}

export default function StudentTestResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [version, setVersion] = useState<TestVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  
  const { currentConfig } = usePlacementConfig();

  useEffect(() => {
    if (id) {
      loadResultData();
    }
  }, [id]);

  const loadResultData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const attemptData = await memoryRepo.getAttempt(id);
      if (!attemptData) {
        toast.error("시험 결과를 찾을 수 없습니다.");
        navigate('/s');
        return;
      }

      if (attemptData.status !== 'submitted') {
        toast.error("아직 제출되지 않은 시험입니다.");
        navigate('/s');
        return;
      }

      setAttempt(attemptData);

      const tests = await memoryRepo.listTests();
      const testData = tests.find(t => t.id === attemptData.testId);
      if (testData) {
        setTest(testData);
        const versionData = testData.versions?.find(v => v.id === attemptData.versionId);
        if (versionData) {
          setVersion(versionData);
          calculateSectionResults(versionData, attemptData.answers || {});
        }
      }
    } catch (error) {
      console.error('Failed to load result data:', error);
      toast.error("결과 데이터를 불러오는데 실패했습니다.");
      navigate('/s');
    } finally {
      setLoading(false);
    }
  };

  const calculateSectionResults = (version: TestVersion, answers: Record<string, string>) => {
    if (!version.sections) return;

    const results: SectionResult[] = version.sections.map(section => {
      const questions = section.questions || [];
      let earnedPoints = 0;
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let pendingReview = 0;

      questions.forEach(question => {
        const userAnswer = answers[question.id];
        
        if (question.type === 'MCQ' && question.choices && question.answer !== undefined && userAnswer) {
          const selectedIndex = question.choices.indexOf(userAnswer);
          if (selectedIndex === question.answer) {
            earnedPoints += question.points;
            correctAnswers++;
          } else {
            incorrectAnswers++;
          }
        } else if (question.type === 'Short' && question.answer && userAnswer) {
          if (userAnswer.trim().toLowerCase() === String(question.answer).toLowerCase()) {
            earnedPoints += question.points;
            correctAnswers++;
          } else {
            incorrectAnswers++;
          }
        } else if (question.type === 'Speaking') {
          // Speaking questions are always pending review
          pendingReview++;
        } else if (userAnswer) {
          // Answered but not auto-gradable
          incorrectAnswers++;
        }
      });

      return {
        section,
        totalQuestions: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        earnedPoints,
        correctAnswers,
        incorrectAnswers,
        pendingReview,
      };
    });

    setSectionResults(results);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('ko-KR');
  };

  const getScorePercentage = () => {
    if (!attempt?.autoTotal || !attempt?.maxTotal) return 0;
    return Math.round((attempt.autoTotal / attempt.maxTotal) * 100);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleGeneratePDF = async () => {
    if (!attempt || !test || !version) return;
    
    try {
      toast.loading('PDF를 생성하고 있습니다...');
      
      await PDFGenerator.generateScoreReport({
        attempt,
        test,
        version,
        sectionResults
      });
      
      toast.dismiss();
      toast.success('성적표 PDF가 다운로드되었습니다.');
    } catch (error) {
      toast.dismiss();
      toast.error('PDF 생성에 실패했습니다.');
      console.error('PDF generation failed:', error);
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
          <p className="text-muted-foreground">결과 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const scorePercentage = getScorePercentage();
  const placementRecommendation = attempt && currentConfig ? 
    placementUtils.calculatePlacement(attempt, currentConfig) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">시험 결과</h1>
              <p className="text-muted-foreground">
                {formatDate(attempt.submittedAt || attempt.startedAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGeneratePDF}>
                <Download className="h-4 w-4 mr-2" />
                성적표 PDF
              </Button>
              <Button variant="outline" onClick={() => navigate('/s')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </div>
          </div>

          {/* Overall Score Card */}
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <CardTitle className="text-2xl">{test.name}</CardTitle>
              </div>
              <p className="text-lg text-muted-foreground">
                {version.system} {version.grade}
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="space-y-2">
                <div className={`text-6xl font-bold ${getGradeColor(scorePercentage)}`}>
                  {scorePercentage}점
                </div>
                <div className="text-xl text-muted-foreground">
                  {attempt.autoTotal} / {attempt.maxTotal}
                </div>
                <Progress value={scorePercentage} className="h-3 mx-auto max-w-md" />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {sectionResults.reduce((sum, result) => sum + result.correctAnswers, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">정답</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {sectionResults.reduce((sum, result) => sum + result.incorrectAnswers, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">오답</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placement Recommendation */}
          {placementRecommendation && (
            <PlacementRecommendationCard 
              recommendation={placementRecommendation}
              className="border-primary/20"
            />
          )}

          {/* Section Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                섹션별 결과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sectionResults.map((result, index) => (
                <div key={result.section.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {index + 1}. {result.section.label || result.section.type}
                    </h3>
                    <Badge variant="outline">
                      {result.earnedPoints} / {result.totalPoints}점
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>정답: {result.correctAnswers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>오답: {result.incorrectAnswers}</span>
                    </div>
                      {result.pendingReview > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span>검토 대기: {result.pendingReview}</span>
                          {attempt?.autoSpeaking && Object.keys(attempt.autoSpeaking).length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              자동채점(검토대기)
                            </Badge>
                          )}
                        </div>
                      )}
                    <div className="text-muted-foreground">
                      총 {result.totalQuestions}문항
                    </div>
                  </div>
                  
                  <Progress 
                    value={result.totalPoints > 0 ? (result.earnedPoints / result.totalPoints) * 100 : 0} 
                    className="h-2"
                  />
                  
                  {index < sectionResults.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Speaking Notice */}
          {sectionResults.some(result => result.pendingReview > 0) && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Clock className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Speaking 평가 안내</div>
                    <div className="text-sm opacity-90">
                      Speaking 문항은 담당 교사의 검토 후 점수가 반영됩니다.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Info */}
          <Card>
            <CardHeader>
              <CardTitle>시험 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">시험명:</span> {test.name}
                </div>
                <div>
                  <span className="font-medium">버전:</span> {version.system} {version.grade}
                </div>
                <div>
                  <span className="font-medium">시작 시간:</span> {formatDate(attempt.startedAt)}
                </div>
                <div>
                  <span className="font-medium">제출 시간:</span> {formatDate(attempt.submittedAt || attempt.startedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}