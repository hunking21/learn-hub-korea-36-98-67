import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Camera, FileText, CheckCircle2, Clock, Eye, Users, AlertCircle } from 'lucide-react';
import { QRScanner } from '@/components/offline/QRScanner';
import { OMRExtractor } from '@/components/offline/OMRExtractor';
import { GradingReview } from '@/components/offline/GradingReview';
import { toast } from 'sonner';

interface ScannedData {
  testId: string;
  versionId: string;
  layoutSeed: number;
  numQuestions: number;
}

interface ExtractedAnswers {
  mcqAnswers: Record<string, number>; // questionId -> choice index
  shortAnswers: Record<string, string>; // questionId -> text
  studentInfo: {
    name: string;
    studentId: string;
  };
}

interface OfflineSubmission {
  id: string;
  testId: string;
  versionId: string;
  candidate: {
    name: string;
    system: string;
    grade: string;
    note?: string;
  };
  status: 'submitted_offline' | 'reviewing' | 'completed';
  submittedAt: string;
  offlineData: {
    originalImages: string[];
    processedImages: string[];
    extractedData: any[];
    submissionDate: string;
  };
  answers?: Record<string, string>;
  autoTotal?: number;
  maxTotal?: number;
  finalTotal?: number;
}

export default function OfflineGrading() {
  const [currentStep, setCurrentStep] = useState<'scan' | 'extract' | 'review' | 'complete'>('scan');
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedAnswers, setExtractedAnswers] = useState<ExtractedAnswers | null>(null);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [offlineSubmissions, setOfflineSubmissions] = useState<OfflineSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<OfflineSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    loadOfflineSubmissions();
  }, []);

  const loadOfflineSubmissions = () => {
    const submissions = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
    setOfflineSubmissions(submissions);
  };

  const handleQRScanned = (data: ScannedData) => {
    setScannedData(data);
    setCurrentStep('extract');
    toast.success('QR 코드를 성공적으로 읽었습니다');
    addLog(`QR 스캔 완료: 시험 ${data.testId.slice(0, 8)}..., 버전 ${data.versionId.slice(0, 8)}...`);
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    addLog('이미지 업로드 완료');
  };

  const handleAnswersExtracted = (answers: ExtractedAnswers) => {
    setExtractedAnswers(answers);
    setCurrentStep('review');
    toast.success('답안 추출이 완료되었습니다');
    addLog(`답안 추출 완료: MCQ ${Object.keys(answers.mcqAnswers).length}개, Short ${Object.keys(answers.shortAnswers).length}개`);
  };

  const handleGradingComplete = () => {
    setCurrentStep('complete');
    loadOfflineSubmissions(); // 새로운 제출물 다시 로드
    toast.success('채점이 완료되어 저장되었습니다');
    addLog('채점 완료 및 저장');
  };

  const openSubmissionReview = (submission: OfflineSubmission) => {
    setSelectedSubmission(submission);
    setReviewDialogOpen(true);
  };

  const updateSubmissionStatus = (submissionId: string, status: OfflineSubmission['status']) => {
    const submissions = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
    const updatedSubmissions = submissions.map((sub: OfflineSubmission) =>
      sub.id === submissionId ? { ...sub, status } : sub
    );
    localStorage.setItem('offlineSubmissions', JSON.stringify(updatedSubmissions));
    setOfflineSubmissions(updatedSubmissions);
  };

  const getStatusBadge = (status: OfflineSubmission['status']) => {
    switch (status) {
      case 'submitted_offline':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />승인 대기</Badge>;
      case 'reviewing':
        return <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" />검수 중</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" />완료</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const resetProcess = () => {
    setCurrentStep('scan');
    setScannedData(null);
    setUploadedImage(null);
    setExtractedAnswers(null);
    setProcessingLogs([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">오프라인 채점</h1>
          <p className="text-muted-foreground">
            오프라인 제출물 검수 및 답안지 이미지 OMR 자동 채점
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            대기 중: {offlineSubmissions.filter(s => s.status === 'submitted_offline').length}
          </Badge>
          {currentStep !== 'scan' && (
            <Button variant="outline" onClick={resetProcess}>
              새로 시작
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">제출물 관리</TabsTrigger>
          <TabsTrigger value="manual">수동 채점</TabsTrigger>
          <TabsTrigger value="batch">일괄 처리</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                오프라인 제출물 ({offlineSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {offlineSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>아직 제출된 오프라인 답안이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {offlineSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{submission.candidate.name}</h3>
                          {getStatusBadge(submission.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>학제: {submission.candidate.system} | 학년: {submission.candidate.grade}</p>
                          <p>시험 ID: {submission.testId}</p>
                          <p>제출일: {new Date(submission.submittedAt).toLocaleString()}</p>
                          <p>이미지: {submission.offlineData.originalImages.length}개</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {submission.status === 'submitted_offline' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              updateSubmissionStatus(submission.id, 'reviewing');
                              toast.success('검수를 시작합니다');
                            }}
                          >
                            검수 시작
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSubmissionReview(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[
              { key: 'scan', label: '스캔/업로드', icon: Camera },
              { key: 'extract', label: '답안 추출', icon: FileText },
              { key: 'review', label: '검수', icon: CheckCircle2 },
              { key: 'complete', label: '완료', icon: CheckCircle2 }
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted = ['scan', 'extract', 'review', 'complete'].indexOf(currentStep) > index;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-primary bg-primary text-primary-foreground' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-muted-foreground text-muted-foreground'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'font-semibold' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {currentStep === 'scan' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      답안지 스캔/업로드
                    </CardTitle>
                    <CardDescription>
                      QR 코드가 포함된 답안지를 스캔하거나 업로드하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="camera" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="camera" className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          카메라 스캔
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          파일 업로드
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="camera" className="mt-4">
                        <QRScanner 
                          onQRScanned={handleQRScanned}
                          onImageCapture={handleImageUpload}
                        />
                      </TabsContent>
                      <TabsContent value="upload" className="mt-4">
                        <QRScanner 
                          mode="upload"
                          onQRScanned={handleQRScanned}
                          onImageCapture={handleImageUpload}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'extract' && scannedData && uploadedImage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      답안 추출
                    </CardTitle>
                    <CardDescription>
                      OMR 마킹과 텍스트 답안을 자동으로 추출합니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OMRExtractor
                      imageUrl={uploadedImage}
                      testData={scannedData}
                      onAnswersExtracted={handleAnswersExtracted}
                      onLog={addLog}
                    />
                  </CardContent>
                </Card>
              )}

              {currentStep === 'review' && extractedAnswers && scannedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      답안 검수 및 채점
                    </CardTitle>
                    <CardDescription>
                      추출된 답안을 확인하고 수정한 후 최종 채점을 진행하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GradingReview
                      extractedAnswers={extractedAnswers}
                      testData={scannedData}
                      originalImage={uploadedImage}
                      onGradingComplete={handleGradingComplete}
                      onLog={addLog}
                    />
                  </CardContent>
                </Card>
              )}

              {currentStep === 'complete' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      채점 완료
                    </CardTitle>
                    <CardDescription>
                      답안지가 성공적으로 처리되어 시스템에 저장되었습니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• 학생 답안이 시험 시스템에 저장되었습니다</p>
                      <p>• 자동 채점이 완료되었습니다</p>
                      <p>• 원본 이미지가 보관되었습니다</p>
                    </div>
                    <Button onClick={resetProcess} className="w-full">
                      다른 답안지 처리하기
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Processing Logs Sidebar */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-sm">처리 로그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {processingLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">아직 처리 내역이 없습니다</p>
                  ) : (
                    processingLogs.map((log, index) => (
                      <div key={index} className="text-xs p-2 bg-muted rounded text-muted-foreground">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>일괄 처리</CardTitle>
              <CardDescription>
                여러 답안지를 한 번에 처리할 수 있는 기능입니다 (추후 구현 예정)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8 text-muted-foreground">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>일괄 처리 기능은 준비 중입니다</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 제출물 상세 리뷰 다이얼로그 */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              제출물 상세 검수 - {selectedSubmission?.candidate.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              {/* 학생 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">학생 정보</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>이름:</strong> {selectedSubmission.candidate.name}</div>
                  <div><strong>학제:</strong> {selectedSubmission.candidate.system}</div>
                  <div><strong>학년:</strong> {selectedSubmission.candidate.grade}</div>
                  <div><strong>제출일:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                  <div><strong>시험 ID:</strong> {selectedSubmission.testId}</div>
                  <div><strong>버전 ID:</strong> {selectedSubmission.versionId}</div>
                </CardContent>
              </Card>

              {/* 제출된 이미지들 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">제출된 이미지 ({selectedSubmission.offlineData.originalImages.length}개)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedSubmission.offlineData.originalImages.map((imageUrl, index) => (
                      <div key={index} className="space-y-2">
                        <img
                          src={imageUrl}
                          alt={`제출 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                        <p className="text-xs text-center text-muted-foreground">
                          이미지 {index + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 추출된 답안 데이터 (있는 경우) */}
              {selectedSubmission.offlineData.extractedData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">추출된 답안</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedSubmission.offlineData.extractedData.map((data, index) => (
                        <div key={index} className="p-3 bg-muted rounded text-sm">
                          <p><strong>이미지 {index + 1}:</strong></p>
                          {data?.mcqAnswers && (
                            <p>객관식: {Object.keys(data.mcqAnswers).length}개 답안</p>
                          )}
                          {data?.shortAnswers && (
                            <p>주관식: {Object.keys(data.shortAnswers).length}개 답안</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 상태 업데이트 버튼 */}
              <div className="flex gap-2 pt-4">
                {selectedSubmission.status === 'submitted_offline' && (
                  <Button
                    onClick={() => {
                      updateSubmissionStatus(selectedSubmission.id, 'reviewing');
                      setSelectedSubmission({ ...selectedSubmission, status: 'reviewing' });
                      toast.success('검수 상태로 변경되었습니다');
                    }}
                  >
                    검수 시작
                  </Button>
                )}
                
                {selectedSubmission.status === 'reviewing' && (
                  <Button
                    onClick={() => {
                      updateSubmissionStatus(selectedSubmission.id, 'completed');
                      setSelectedSubmission({ ...selectedSubmission, status: 'completed' });
                      toast.success('검수가 완료되었습니다');
                    }}
                  >
                    검수 완료
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}