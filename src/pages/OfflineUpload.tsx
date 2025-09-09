import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ImagePreprocessor } from '@/components/offline/ImagePreprocessor';
import { Upload, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OfflineTestData {
  testId: string;
  versionId: string;
  layoutSeed: number;
  testName?: string;
}

interface StudentInfo {
  name: string;
  system: 'KR' | 'US' | 'UK';
  grade: string;
}

interface ProcessedImage {
  original: string;
  processed: string;
  extractedData?: {
    mcqAnswers: Record<string, number>;
    shortAnswers: Record<string, string>;
  };
}

export default function OfflineUpload() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState<OfflineTestData | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    name: '',
    system: 'KR',
    grade: ''
  });
  
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'info' | 'upload' | 'process' | 'review' | 'submit'>('info');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      decodeToken(token);
    }
  }, [token]);

  const decodeToken = (token: string) => {
    try {
      // Base64 디코딩하여 토큰에서 시험 정보 추출
      const decoded = JSON.parse(atob(token));
      setTestData(decoded);
      toast.success('시험 정보를 불러왔습니다');
    } catch (error) {
      console.error('토큰 디코딩 실패:', error);
      toast.error('유효하지 않은 QR 코드입니다');
      navigate('/');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('이미지 파일을 선택해주세요');
      return;
    }

    setUploadedImages(prev => [...prev, ...imageFiles]);
    toast.success(`${imageFiles.length}개 이미지가 업로드되었습니다`);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    if (uploadedImages.length === 0) {
      toast.error('처리할 이미지가 없습니다');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setCurrentStep('process');

    try {
      const processed: ProcessedImage[] = [];

      for (let i = 0; i < uploadedImages.length; i++) {
        const file = uploadedImages[i];
        setProcessingProgress((i / uploadedImages.length) * 100);

        // 이미지를 URL로 변환
        const originalUrl = URL.createObjectURL(file);
        
        // 이미지 전처리 시뮬레이션 (실제로는 ImagePreprocessor 컴포넌트에서 처리)
        const processedUrl = await simulateImageProcessing(originalUrl);
        
        // OMR 데이터 추출 시뮬레이션
        const extractedData = await simulateOMRExtraction();

        processed.push({
          original: originalUrl,
          processed: processedUrl,
          extractedData
        });
      }

      setProcessedImages(processed);
      setProcessingProgress(100);
      setCurrentStep('review');
      toast.success('이미지 처리가 완료되었습니다');

    } catch (error) {
      console.error('이미지 처리 실패:', error);
      toast.error('이미지 처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateImageProcessing = async (originalUrl: string): Promise<string> => {
    // 실제로는 ImagePreprocessor에서 처리
    await new Promise(resolve => setTimeout(resolve, 1000));
    return originalUrl; // 임시로 원본 반환
  };

  const simulateOMRExtraction = async (): Promise<{ mcqAnswers: Record<string, number>; shortAnswers: Record<string, string> }> => {
    // 실제로는 OMRExtractor에서 처리
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      mcqAnswers: {
        'q1': Math.floor(Math.random() * 4),
        'q2': Math.floor(Math.random() * 4),
        'q3': Math.floor(Math.random() * 4),
      },
      shortAnswers: {}
    };
  };

  const submitOfflineAttempt = async () => {
    if (!testData || !studentInfo.name.trim()) {
      toast.error('학생 정보를 모두 입력해주세요');
      return;
    }

    if (processedImages.length === 0) {
      toast.error('처리된 이미지가 없습니다');
      return;
    }

    setCurrentStep('submit');

    try {
      // 통합된 답안 생성
      const combinedAnswers: Record<string, string> = {};
      processedImages.forEach((img, index) => {
        if (img.extractedData) {
          Object.entries(img.extractedData.mcqAnswers).forEach(([qId, answer]) => {
            combinedAnswers[`${qId}_page${index + 1}`] = String(answer);
          });
          Object.entries(img.extractedData.shortAnswers).forEach(([qId, answer]) => {
            combinedAnswers[`${qId}_page${index + 1}`] = answer;
          });
        }
      });

      // 오프라인 응시 데이터 생성
      const attemptData = {
        id: `offline_${Date.now()}`,
        testId: testData.testId,
        versionId: testData.versionId,
        startedAt: new Date().toISOString(),
        status: 'submitted_offline',
        candidate: {
          name: studentInfo.name,
          system: studentInfo.system,
          grade: studentInfo.grade,
          note: `오프라인 제출 - ${uploadedImages.length}개 이미지`
        },
        answers: combinedAnswers,
        submittedAt: new Date().toISOString(),
        layout: {
          seed: testData.layoutSeed
        },
        offlineData: {
          originalImages: processedImages.map(img => img.original),
          processedImages: processedImages.map(img => img.processed),
          extractedData: processedImages.map(img => img.extractedData),
          submissionDate: new Date().toISOString(),
          deviceInfo: navigator.userAgent
        }
      };

      // 로컬 스토리지에 저장 (서버가 없으므로)
      const existingAttempts = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
      existingAttempts.push(attemptData);
      localStorage.setItem('offlineSubmissions', JSON.stringify(existingAttempts));

      toast.success('답안이 성공적으로 제출되었습니다!');
      
      // 성공 페이지로 이동하거나 홈으로 이동
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);

    } catch (error) {
      console.error('제출 실패:', error);
      toast.error('제출 중 오류가 발생했습니다');
    }
  };

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">시험 정보를 불러오는 중...</h2>
            <p className="text-sm text-muted-foreground">
              QR 코드가 유효하지 않거나 만료되었을 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">오프라인 답안 제출</h1>
          <p className="text-muted-foreground">
            {testData.testName || `시험 ID: ${testData.testId}`}
          </p>
        </div>

        {/* 진행 상황 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">진행 상황</span>
            <span className="text-sm text-muted-foreground">
              {currentStep === 'info' && '1/4'} 
              {currentStep === 'upload' && '2/4'}
              {currentStep === 'process' && '3/4'}
              {(currentStep === 'review' || currentStep === 'submit') && '4/4'}
            </span>
          </div>
          <Progress 
            value={
              currentStep === 'info' ? 25 :
              currentStep === 'upload' ? 50 :
              currentStep === 'process' ? 75 : 100
            } 
            className="h-2" 
          />
        </div>

        {/* 단계별 내용 */}
        {currentStep === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>학생 정보 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    value={studentInfo.name}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="학생 이름을 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>학제 *</Label>
                  <Select 
                    value={studentInfo.system} 
                    onValueChange={(value: 'KR' | 'US' | 'UK') => 
                      setStudentInfo(prev => ({ ...prev, system: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KR">한국</SelectItem>
                      <SelectItem value="US">미국</SelectItem>
                      <SelectItem value="UK">영국</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade">학년 *</Label>
                <Input
                  id="grade"
                  value={studentInfo.grade}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="예: 고등학교 1학년"
                />
              </div>

              <Button 
                onClick={() => setCurrentStep('upload')}
                disabled={!studentInfo.name.trim() || !studentInfo.grade.trim()}
                className="w-full"
              >
                다음 단계
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>답안지 이미지 업로드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">이미지 파일을 업로드하세요</p>
                <p className="text-sm text-muted-foreground mb-4">
                  답안지 사진을 여러 장 선택할 수 있습니다
                </p>
                <Button variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  파일 선택
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">업로드된 이미지 ({uploadedImages.length}개)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`업로드된 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                        <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('info')}>
                  이전
                </Button>
                <Button 
                  onClick={processImages}
                  disabled={uploadedImages.length === 0}
                  className="flex-1"
                >
                  이미지 처리 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'process' && (
          <Card>
            <CardHeader>
              <CardTitle>이미지 처리 중</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <p className="text-lg font-medium mb-2">답안지를 분석하고 있습니다...</p>
                <p className="text-sm text-muted-foreground mb-4">
                  이미지 보정, 문항 인식, 답안 추출을 진행 중입니다.
                </p>
                <Progress value={processingProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">{Math.round(processingProgress)}%</p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>처리 결과 확인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {processedImages.map((img, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-medium">이미지 {index + 1}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">원본</p>
                        <img src={img.original} alt="원본" className="w-full h-32 object-cover rounded border" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">처리된 이미지</p>
                        <img src={img.processed} alt="처리됨" className="w-full h-32 object-cover rounded border" />
                      </div>
                    </div>
                    {img.extractedData && (
                      <div className="text-xs bg-muted p-2 rounded">
                        <p>추출된 답안: {Object.keys(img.extractedData.mcqAnswers).length}개 객관식</p>
                        <p>주관식: {Object.keys(img.extractedData.shortAnswers).length}개</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                  이전
                </Button>
                <Button onClick={submitOfflineAttempt} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  답안 제출
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'submit' && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold mb-2">제출 완료!</h2>
              <p className="text-muted-foreground mb-4">
                답안이 성공적으로 제출되었습니다.<br />
                선생님의 검수를 거쳐 채점이 완료됩니다.
              </p>
              <Button onClick={() => navigate('/')}>
                홈으로 이동
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}