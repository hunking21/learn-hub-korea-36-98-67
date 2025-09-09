import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Search, Eye, CheckCircle, Clock, Trophy, MessageSquare, Download, FileText, Calculator, Link2 } from 'lucide-react';
import { memoryRepo } from '@/repositories/memoryRepo';
import type { TestAttempt, Test, TestVersion, Question, SpeakingReview, SpeakingRubric } from '@/types';
import { AudioPlayer } from '@/components/AudioPlayer';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { SpeakingRubricForm } from '@/components/admin/SpeakingRubricForm';
import { ShortAnswerReview } from '@/components/teacher/ShortAnswerReview';
import { SpeakingAutoGrading } from '@/components/teacher/SpeakingAutoGrading';
import { ResultTokenGenerator } from '@/components/admin/ResultTokenGenerator';
import { useScoringProfiles } from '@/hooks/useScoringProfiles';
import { shortAnswerGradingUtils } from '@/utils/shortAnswerGrading';
import { PlacementRecommendationCard } from '@/components/PlacementRecommendation';
import { usePlacementConfig } from '@/hooks/usePlacementConfig';
import { placementUtils } from '@/utils/placementUtils';
import type { AutoSpeakingResult } from '@/hooks/useSpeakingAutoGrading';
import { toast } from 'sonner';
import { resultTokenManager, StudentTestAttempt } from '@/utils/resultTokenUtils';

interface AttemptWithTestInfo extends TestAttempt {
  testName: string;
  versionInfo: string;
}

export default function TeacherReview() {
  const [attempts, setAttempts] = useState<AttemptWithTestInfo[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<AttemptWithTestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Modal states
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [test, setTest] = useState<Test | null>(null);
  const [version, setVersion] = useState<TestVersion | null>(null);
  const [speakingReviews, setSpeakingReviews] = useState<SpeakingReview[]>([]);
  const [speakingRubrics, setSpeakingRubrics] = useState<Record<string, SpeakingRubric>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isResultTokenModalOpen, setIsResultTokenModalOpen] = useState(false);
  const [selectedAttemptForToken, setSelectedAttemptForToken] = useState<TestAttempt | null>(null);
  
  // Scoring profiles for Short answer grading
  const { currentProfile, loading: profileLoading } = useScoringProfiles();
  const { currentConfig: placementConfig } = usePlacementConfig();

  useEffect(() => {
    loadAttempts();
  }, []);

  useEffect(() => {
    filterAttempts();
  }, [attempts, searchTerm, statusFilter]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const submittedAttempts = await memoryRepo.getSubmittedAttempts();
      const tests = await memoryRepo.listTests();
      
      const attemptsWithInfo: AttemptWithTestInfo[] = submittedAttempts.map(attempt => {
        const test = tests.find(t => t.id === attempt.testId);
        const version = test?.versions?.find(v => v.id === attempt.versionId);
        
        return {
          ...attempt,
          testName: test?.name || 'Unknown Test',
          versionInfo: version ? `${version.system} ${version.grade}` : 'Unknown Version'
        };
      });
      
      setAttempts(attemptsWithInfo);
    } catch (error) {
      console.error('Failed to load attempts:', error);
      toast.error("응시 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filterAttempts = () => {
    let filtered = [...attempts];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(attempt => 
        attempt.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.versionInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(attempt => 
        statusFilter === 'pending' ? attempt.reviewStatus === 'pending' : attempt.reviewStatus === 'completed'
      );
    }
    
    setFilteredAttempts(filtered);
  };

  const handleOpenModal = async (attempt: TestAttempt) => {
    try {
      const tests = await memoryRepo.listTests();
      const testData = tests.find(t => t.id === attempt.testId);
      const versionData = testData?.versions?.find(v => v.id === attempt.versionId);
      
      if (!testData || !versionData) {
        toast.error("시험 정보를 찾을 수 없습니다.");
        return;
      }
      
      setSelectedAttempt(attempt);
      setTest(testData);
      setVersion(versionData);
      
      // Initialize speaking reviews and rubrics
      const speakingQuestions: Question[] = [];
      versionData.sections?.forEach(section => {
        section.questions?.forEach(question => {
          if (question.type === 'Speaking') {
            speakingQuestions.push(question);
          }
        });
      });
      
      const existingReviews = attempt.speakingReviews || [];
      const existingRubrics = attempt.rubric || {};
      
      const initialReviews = speakingQuestions.map(question => {
        const existing = existingReviews.find(r => r.questionId === question.id);
        return existing || {
          questionId: question.id,
          manualScore: 0,
          comment: ''
        };
      });

      const initialRubrics: Record<string, SpeakingRubric> = {};
      speakingQuestions.forEach(question => {
        initialRubrics[question.id] = existingRubrics[question.id] || {
          criteria: [
            { key: 'fluency', score: 0, weight: 25 },
            { key: 'pronunciation', score: 0, weight: 25 },
            { key: 'grammar', score: 0, weight: 25 },
            { key: 'content', score: 0, weight: 25 }
          ],
          comment: ''
        };
      });
      
      setSpeakingReviews(initialReviews);
      setSpeakingRubrics(initialRubrics);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to open modal:', error);
      toast.error("상세 정보를 불러오는데 실패했습니다.");
    }
  };

  const handleReviewChange = (questionId: string, field: 'manualScore' | 'comment', value: string | number) => {
    setSpeakingReviews(prev => prev.map(review => 
      review.questionId === questionId 
        ? { ...review, [field]: value }
        : review
    ));
  };

  const handleRubricChange = (questionId: string, rubric: SpeakingRubric) => {
    setSpeakingRubrics(prev => ({
      ...prev,
      [questionId]: rubric
    }));

    // Calculate weighted score and update review
    const question = getSpeakingQuestions().find(q => q.id === questionId);
    if (question) {
      const weightedScore = rubric.criteria.reduce((sum, criterion) => 
        sum + (criterion.score * criterion.weight / 100), 0
      );
      const finalScore = Math.round((weightedScore / 4) * question.points * 100) / 100;
      
      setSpeakingReviews(prev => prev.map(review => 
        review.questionId === questionId 
          ? { ...review, manualScore: finalScore, comment: rubric.comment }
          : review
      ));
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedAttempt) return;
    
    try {
      setSubmitting(true);
      
      // Calculate total human score from rubrics
      const humanTotal = speakingReviews.reduce((sum, review) => sum + (review.manualScore || 0), 0);
      
      await memoryRepo.reviewAttempt(selectedAttempt.id, speakingReviews, speakingRubrics, humanTotal);
      
      toast.success("리뷰가 완료되었습니다.");
      setModalOpen(false);
      loadAttempts(); // Reload to update the list
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error("리뷰 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('ko-KR');
  };

  const getScorePercentage = (autoTotal: number, maxTotal: number) => {
    return maxTotal > 0 ? Math.round((autoTotal / maxTotal) * 100) : 0;
  };

  const handleGeneratePDF = async (attempt: TestAttempt) => {
    try {
      const tests = await memoryRepo.listTests();
      const testData = tests.find(t => t.id === attempt.testId);
      const versionData = testData?.versions?.find(v => v.id === attempt.versionId);
      
      if (!testData || !versionData) {
        toast.error("시험 정보를 찾을 수 없습니다.");
        return;
      }

      toast.loading('PDF를 생성하고 있습니다...');

      await PDFGenerator.generateScoreReport({
        attempt,
        test: testData,
        version: versionData
      });

      toast.dismiss();
      toast.success('성적표 PDF가 다운로드되었습니다.');
    } catch (error) {
      toast.dismiss();
      toast.error('PDF 생성에 실패했습니다.');
      console.error('PDF generation failed:', error);
    }
  };

  const handleGenerateBulkPDF = async () => {
    if (filteredAttempts.length === 0) {
      toast.error('다운로드할 시도가 없습니다.');
      return;
    }

    try {
      toast.loading('일괄 PDF를 생성하고 있습니다...');
      
      const tests = await memoryRepo.listTests();
      const pdfOptions = filteredAttempts.map(attempt => {
        const testData = tests.find(t => t.id === attempt.testId);
        const versionData = testData?.versions?.find(v => v.id === attempt.versionId);
        
        if (!testData || !versionData) {
          throw new Error(`시험 정보를 찾을 수 없습니다: ${attempt.id}`);
        }

        return {
          attempt,
          test: testData,
          version: versionData
        };
      });

      await PDFGenerator.generateBulkPDFs(pdfOptions);

      toast.dismiss();
      toast.success(`${filteredAttempts.length}개의 성적표가 ZIP 파일로 다운로드되었습니다.`);
    } catch (error) {
      toast.dismiss();
      toast.error('일괄 PDF 생성에 실패했습니다.');
      console.error('Bulk PDF generation failed:', error);
    }
  };

  const getSpeakingQuestions = () => {
    if (!version?.sections) return [];
    const questions: Question[] = [];
    version.sections.forEach(section => {
      section.questions?.forEach(question => {
        if (question.type === 'Speaking') {
          questions.push(question);
        }
      });
    });
    return questions;
  };

  const getShortAnswerQuestions = () => {
    if (!version?.sections) return [];
    const questions: Question[] = [];
    version.sections.forEach(section => {
      section.questions?.forEach(question => {
        if (question.type === 'Short') {
          questions.push(question);
        }
      });
    });
    return questions;
  };

  const checkShortAnswerCorrect = (questionId: string, userAnswer: string) => {
    if (!currentProfile) return false;
    
    const shortQuestions = getShortAnswerQuestions();
    const question = shortQuestions.find(q => q.id === questionId);
    
    if (!question || !question.answer) return false;
    
    const correctAnswers = Array.isArray(question.answer) 
      ? question.answer 
      : [String(question.answer)];
    
    return shortAnswerGradingUtils.checkAnswer(
      userAnswer,
      correctAnswers,
      currentProfile.shortConfig
    );
  };

  const handleAutoGradeComplete = async (questionId: string, result: AutoSpeakingResult) => {
    if (!selectedAttempt) return;
    
    try {
      const updatedAutoSpeaking = {
        ...selectedAttempt.autoSpeaking,
        [questionId]: result
      };
      
      const updatedAttempt = {
        ...selectedAttempt,
        autoSpeaking: updatedAutoSpeaking
      };
      
      await memoryRepo.updateAttemptData(selectedAttempt.id, { autoSpeaking: updatedAutoSpeaking });
      setSelectedAttempt(updatedAttempt);
      
    } catch (error) {
      console.error('Failed to save auto grading result:', error);
      toast.error('자동 채점 결과 저장에 실패했습니다.');
    }
  };

  const handleApproveAutoScore = async (questionId: string) => {
    if (!selectedAttempt?.autoSpeaking?.[questionId]) return;
    
    try {
      const autoResult = selectedAttempt.autoSpeaking[questionId];
      const question = getSpeakingQuestions().find(q => q.id === questionId);
      if (!question) return;
      
      // Calculate final score from auto scores
      const averageScore = (
        autoResult.scores.fluency + 
        autoResult.scores.pronunciation + 
        autoResult.scores.grammar + 
        autoResult.scores.content
      ) / 4;
      
      const finalScore = Math.round((averageScore / 4) * question.points * 100) / 100;
      
      // Update speaking review with auto score
      setSpeakingReviews(prev => prev.map(review => 
        review.questionId === questionId 
          ? { 
              ...review, 
              manualScore: finalScore,
              comment: `자동채점 승인 (${new Date().toLocaleString('ko-KR')})\n전사: ${autoResult.transcript}`
            }
          : review
      ));
      
      toast.success('자동 점수가 최종 점수로 반영되었습니다.');
      
    } catch (error) {
      console.error('Failed to approve auto score:', error);
      toast.error('자동 점수 승인에 실패했습니다.');
    }
  };

  const handleAddToAnswerKey = async (questionId: string, newAnswer: string) => {
    if (!selectedAttempt || !test || !version) {
      toast.error('시험 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      // Find the section containing this question
      let targetSectionId = '';
      for (const section of version.sections || []) {
        if (section.questions?.some(q => q.id === questionId)) {
          targetSectionId = section.id;
          break;
        }
      }

      if (!targetSectionId) {
        toast.error('문제 섹션을 찾을 수 없습니다.');
        return;
      }

      // Add answer to question key
      await memoryRepo.addAnswerToQuestionKey(
        test.id,
        version.id,
        targetSectionId,
        questionId,
        newAnswer
      );

      // Re-grade all attempts for this test/version
      const regradeResult = await memoryRepo.regradeShortAnswers(test.id, version.id);
      
      toast.success(`정답이 추가되었습니다. ${regradeResult.updated}개의 시도가 재채점되었습니다.`);
      
      // Reload attempts to refresh the list
      await loadAttempts();
      
      // Update current attempt in modal if it was affected
      if (regradeResult.attempts.some(a => a.id === selectedAttempt.id)) {
        const updatedAttempt = regradeResult.attempts.find(a => a.id === selectedAttempt.id);
        if (updatedAttempt) {
          setSelectedAttempt(updatedAttempt);
        }
      }
      
    } catch (error) {
      console.error('Failed to add answer to key:', error);
      toast.error('정답 추가에 실패했습니다.');
    }
  };

  const handleOpenResultTokenModal = (attempt: TestAttempt) => {
    if (attempt.status !== 'submitted') {
      toast.error('제출된 시험만 결과 링크를 생성할 수 있습니다.');
      return;
    }
    setSelectedAttemptForToken(attempt);
    setIsResultTokenModalOpen(true);
  };

  const convertToStudentTestAttempt = (attempt: TestAttempt): StudentTestAttempt => {
    return {
      id: attempt.id,
      studentId: attempt.candidate?.name || 'unknown', // Use name as fallback for ID
      studentName: attempt.candidate?.name || 'Unknown Student',
      testId: attempt.testId,
      testName: attempts.find(a => a.id === attempt.id)?.testName || 'Unknown Test',
      completedAt: attempt.submittedAt || new Date().toISOString(),
      score: attempt.finalTotal || 0,
      maxScore: attempt.maxTotal || 100,
      percentage: attempt.maxTotal ? Math.round((attempt.finalTotal || 0) / attempt.maxTotal * 100) : 0,
      grade: 'N/A', // You might want to calculate this based on percentage
      resultToken: resultTokenManager.getAllAttempts().find(a => a.id === attempt.id)?.resultToken
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">학생 시험 리뷰</h1>
        <p className="text-muted-foreground mt-2">
          제출된 시험을 검토하고 Speaking 문항을 채점하세요.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="시험명, 버전, ID로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">리뷰 대기</SelectItem>
                  <SelectItem value="completed">리뷰 완료</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleGenerateBulkPDF} 
                disabled={filteredAttempts.length === 0}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                일괄 PDF
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {attempts.length === 0 ? '제출된 시험이 없습니다.' : '검색 결과가 없습니다.'}
            </CardContent>
          </Card>
        ) : (
          filteredAttempts.map((attempt) => (
            <Card key={attempt.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenModal(attempt)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{attempt.testName}</h3>
                      <Badge variant="outline">{attempt.versionInfo}</Badge>
                      <Badge variant={attempt.reviewStatus === 'completed' ? 'default' : 'secondary'}>
                        {attempt.reviewStatus === 'completed' ? '리뷰 완료' : '리뷰 대기'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>응시 ID: {attempt.id.slice(0, 8)}...</span>
                      {attempt.candidate && (
                        <>
                          <span>응시자: {attempt.candidate.name}</span>
                          <span>학제/학년: {attempt.candidate.system} {attempt.candidate.grade}</span>
                        </>
                      )}
                      <span>제출: {formatDate(attempt.submittedAt || '')}</span>
                      <span>자동 점수: {attempt.autoTotal} / {attempt.maxTotal}</span>
                      {attempt.finalTotal !== undefined && (
                        <span className="font-medium text-foreground">
                          최종 점수: {attempt.finalTotal} / {attempt.maxTotal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {getScorePercentage(attempt.autoTotal || 0, attempt.maxTotal || 1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">자동 채점</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGeneratePDF(attempt);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenResultTokenModal(attempt);
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        결과링크
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        상세 보기
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              시험 리뷰: {test?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAttempt && version && currentProfile && !profileLoading && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">채점 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">자동 채점:</span> {selectedAttempt.autoTotal} / {selectedAttempt.maxTotal}
                    </div>
                    <div>
                      <span className="font-medium">제출 시간:</span> {formatDate(selectedAttempt.submittedAt || '')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Short Answer Questions Review */}
              {getShortAnswerQuestions().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      서술형 문항 검수
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getShortAnswerQuestions().map((question, index) => {
                      const userAnswer = selectedAttempt.answers?.[question.id] || '';
                      const isCorrect = userAnswer ? checkShortAnswerCorrect(question.id, userAnswer) : false;
                      
                      return (
                        <ShortAnswerReview
                          key={question.id}
                          question={question}
                          questionIndex={index}
                          userAnswer={userAnswer}
                          currentProfile={currentProfile!}
                          onAddToAnswerKey={handleAddToAnswerKey}
                          isCorrect={isCorrect}
                          attemptId={selectedAttempt.id}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Speaking Questions Review */}
              {getSpeakingQuestions().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Speaking 문항 채점
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="traditional" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="traditional">전통적 채점</TabsTrigger>
                        <TabsTrigger value="rubric" className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Rubric 채점
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="traditional" className="space-y-6 mt-6">
                        {getSpeakingQuestions().map((question, index) => {
                          const userAudio = selectedAttempt?.audioAnswers?.[question.id];
                          const autoResult = selectedAttempt?.autoSpeaking?.[question.id];
                          
                          return (
                            <div key={question.id} className="space-y-4">
                              {/* Auto Grading Section */}
                              <SpeakingAutoGrading
                                question={question}
                                questionIndex={index}
                                audioUrl={userAudio}
                                existingResult={autoResult}
                                onAutoGradeComplete={handleAutoGradeComplete}
                                onApproveAutoScore={handleApproveAutoScore}
                              />
                              
                              {/* Manual Review Section */}
                              <Card className="border-purple-200 bg-purple-50">
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <MessageSquare className="w-5 h-5 text-purple-600" />
                                      문제 {index + 1} - 수동 채점
                                    </CardTitle>
                                    <Badge variant="outline">{question.points}점</Badge>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">문제 내용</Label>
                                    <div className="text-sm text-muted-foreground mt-1 p-2 bg-background rounded border">
                                      {question.prompt}
                                    </div>
                                  </div>

                                  {userAudio && (
                                    <div>
                                      <Label className="text-sm font-medium">학생 답안 (음성)</Label>
                                      <div className="mt-1">
                                        <AudioPlayer audioUrl={userAudio} />
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor={`review-score-${question.id}`} className="text-sm font-medium">
                                        점수 (0 ~ {question.points}점)
                                      </Label>
                                      <Input
                                        id={`review-score-${question.id}`}
                                        type="number"
                                        min="0"
                                        max={question.points}
                                        step="0.1"
                                        value={speakingReviews.find(r => r.questionId === question.id)?.manualScore || 0}
                                        onChange={(e) => handleReviewChange(question.id, 'manualScore', parseFloat(e.target.value))}
                                        className="mt-1"
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor={`review-comment-${question.id}`} className="text-sm font-medium">
                                        코멘트
                                      </Label>
                                      <Textarea
                                        id={`review-comment-${question.id}`}
                                        value={speakingReviews.find(r => r.questionId === question.id)?.comment || ''}
                                        onChange={(e) => handleReviewChange(question.id, 'comment', e.target.value)}
                                        placeholder="학생에게 전달할 피드백을 입력하세요..."
                                        className="mt-1"
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                        
                        <div className="flex justify-between items-center pt-4">
                          <div className="text-sm text-muted-foreground">
                            Speaking 총점: {speakingReviews.reduce((sum, r) => sum + (r.manualScore || 0), 0)}점
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                              취소
                            </Button>
                            <Button onClick={handleSubmitReview} disabled={submitting}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {submitting ? '저장 중...' : '리뷰 완료'}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="rubric" className="space-y-6 mt-6">
                        {getSpeakingQuestions().map((question, index) => {
                          const userAnswer = selectedAttempt.answers?.[question.id] || '';
                          const rubric = speakingRubrics[question.id];
                          
                          return (
                            <div key={question.id} className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">문제 {index + 1}</CardTitle>
                                    <Badge variant="outline">{question.points}점 만점</Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {question.prompt}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="mb-4">
                                    <Label className="text-sm font-medium">학생 응답</Label>
                                    <div className="text-sm mt-1 p-2 bg-muted rounded">
                                      {userAnswer === 'recorded' ? (
                                        <div className="space-y-2">
                                          <span>✓ 녹음 완료</span>
                                          {selectedAttempt.audioAnswers?.[question.id] && (
                                            <AudioPlayer
                                              audioUrl={selectedAttempt.audioAnswers[question.id]}
                                              title={`문제 ${index + 1} 답안`}
                                              showDownload={true}
                                            />
                                          )}
                                        </div>
                                      ) : (
                                        '응답 없음'
                                      )}
                                    </div>
                                  </div>
                                  
                                  {rubric && (
                                    <SpeakingRubricForm
                                      questionId={question.id}
                                      maxPoints={question.points}
                                      rubric={rubric}
                                      onRubricChange={handleRubricChange}
                                    />
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                        
                        <div className="flex justify-between items-center pt-4">
                          <div className="text-sm text-muted-foreground">
                            Rubric 총점: {speakingReviews.reduce((sum, r) => sum + (r.manualScore || 0), 0).toFixed(1)}점
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                              취소
                            </Button>
                            <Button onClick={handleSubmitReview} disabled={submitting}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {submitting ? '저장 중...' : 'Rubric 리뷰 완료'}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
              
              {getSpeakingQuestions().length === 0 && getShortAnswerQuestions().length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>이 시험에는 채점할 Speaking이나 서술형 문항이 없습니다.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Result Token Generator Modal */}
      {selectedAttemptForToken && (
        <ResultTokenGenerator
          isOpen={isResultTokenModalOpen}
          onClose={() => {
            setIsResultTokenModalOpen(false);
            setSelectedAttemptForToken(null);
          }}
          attempt={convertToStudentTestAttempt(selectedAttemptForToken)}
        />
      )}
    </div>
  );
}