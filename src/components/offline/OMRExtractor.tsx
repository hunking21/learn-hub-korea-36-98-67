import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Loader2, Settings } from 'lucide-react';

interface OMRExtractorProps {
  imageUrl: string;
  testData: {
    testId: string;
    versionId: string;
    layoutSeed: number;
    numQuestions: number;
  };
  onAnswersExtracted: (answers: {
    mcqAnswers: Record<string, number>;
    shortAnswers: Record<string, string>;
    studentInfo: { name: string; studentId: string };
  }) => void;
  onLog: (message: string) => void;
}

interface OMRCircle {
  x: number;
  y: number;
  radius: number;
  questionIndex: number;
  choiceIndex: number;
  filled: boolean;
}

export const OMRExtractor = ({ imageUrl, testData, onAnswersExtracted, onLog }: OMRExtractorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [threshold, setThreshold] = useState([128]);
  const [detectedCircles, setDetectedCircles] = useState<OMRCircle[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      loadImage();
    }
  }, [imageUrl]);

  const loadImage = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      onLog('이미지 로드 완료');
    };
    img.src = imageUrl;
  };

  const processOMR = async () => {
    if (!canvasRef.current) return;
    
    setIsProcessing(true);
    setProgress(0);
    onLog('OMR 처리 시작');

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 이미지 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setProgress(10);

      // 전처리: 그레이스케일 및 이진화
      onLog('이미지 전처리 중...');
      const processedData = preprocessImage(imageData, threshold[0]);
      setProgress(30);

      // OMR 영역 탐지
      onLog('OMR 영역 탐지 중...');
      const circles = await detectOMRCircles(processedData, canvas.width, canvas.height);
      setDetectedCircles(circles);
      setProgress(60);

      // 마킹 분석
      onLog('마킹 분석 중...');
      const mcqAnswers = analyzeMarkings(circles);
      setProgress(80);

      // 학생 정보 추출 (OCR 대신 임시 값)
      onLog('학생 정보 추출 중...');
      const studentInfo = {
        name: '미입력',
        studentId: '미입력'
      };
      setProgress(90);

      // 결과 반환
      const results = {
        mcqAnswers,
        shortAnswers: {} as Record<string, string>, // 임시로 비움
        studentInfo
      };

      setProgress(100);
      onLog(`추출 완료: MCQ ${Object.keys(mcqAnswers).length}개 답안`);
      
      // 결과 시각화
      drawResults(circles);
      
      onAnswersExtracted(results);
      
    } catch (error) {
      console.error('OMR 처리 실패:', error);
      onLog('OMR 처리 중 오류 발생: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const preprocessImage = (imageData: ImageData, thresholdValue: number): ImageData => {
    const data = imageData.data;
    const processed = new ImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < data.length; i += 4) {
      // 그레이스케일 변환
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      // 이진화
      const binary = avg < thresholdValue ? 0 : 255;
      
      processed.data[i] = binary;     // R
      processed.data[i + 1] = binary; // G
      processed.data[i + 2] = binary; // B
      processed.data[i + 3] = 255;    // A
    }
    
    return processed;
  };

  const detectOMRCircles = async (imageData: ImageData, width: number, height: number): Promise<OMRCircle[]> => {
    const circles: OMRCircle[] = [];
    
    // 간단한 원형 탐지 알고리즘 (실제로는 더 정교한 알고리즘 필요)
    // 여기서는 시뮬레이션을 위해 예상 위치에 원을 배치
    const questionsPerRow = 5; // A, B, C, D, E
    const startY = height * 0.3; // 상단 30% 지점부터 시작
    const rowHeight = 40;
    const circleRadius = 12;
    const startX = width * 0.2;
    const circleSpacing = 30;

    for (let q = 0; q < testData.numQuestions && q < 20; q++) { // 최대 20문항
      const row = Math.floor(q / 1); // 문항당 1행
      const y = startY + (row * rowHeight);
      
      for (let choice = 0; choice < questionsPerRow; choice++) {
        const x = startX + (choice * circleSpacing);
        
        // 해당 위치의 픽셀 밀도 분석하여 마킹 여부 판단
        const filled = analyzeCircleArea(imageData, x, y, circleRadius);
        
        circles.push({
          x,
          y,
          radius: circleRadius,
          questionIndex: q,
          choiceIndex: choice,
          filled
        });
      }
    }
    
    return circles;
  };

  const analyzeCircleArea = (imageData: ImageData, centerX: number, centerY: number, radius: number): boolean => {
    const data = imageData.data;
    const width = imageData.width;
    let darkPixels = 0;
    let totalPixels = 0;
    
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius && x >= 0 && x < width && y >= 0 && y < imageData.height) {
          const index = (y * width + x) * 4;
          const brightness = data[index]; // R 채널 값 (그레이스케일)
          
          if (brightness < 128) darkPixels++; // 어두운 픽셀
          totalPixels++;
        }
      }
    }
    
    // 50% 이상이 어두우면 마킹된 것으로 판단
    return totalPixels > 0 && (darkPixels / totalPixels) > 0.5;
  };

  const analyzeMarkings = (circles: OMRCircle[]): Record<string, number> => {
    const answers: Record<string, number> = {};
    
    // 문항별로 그룹화
    const questionGroups: Record<number, OMRCircle[]> = {};
    circles.forEach(circle => {
      if (!questionGroups[circle.questionIndex]) {
        questionGroups[circle.questionIndex] = [];
      }
      questionGroups[circle.questionIndex].push(circle);
    });
    
    // 각 문항에서 마킹된 선택지 찾기
    Object.entries(questionGroups).forEach(([questionIndex, questionCircles]) => {
      const markedCircles = questionCircles.filter(c => c.filled);
      
      if (markedCircles.length === 1) {
        // 정확히 하나만 마킹된 경우
        const questionId = `q${parseInt(questionIndex) + 1}`;
        answers[questionId] = markedCircles[0].choiceIndex;
      } else if (markedCircles.length > 1) {
        // 중복 마킹된 경우 첫 번째 것을 선택
        const questionId = `q${parseInt(questionIndex) + 1}`;
        answers[questionId] = markedCircles[0].choiceIndex;
      }
      // 마킹이 없는 경우는 무응답으로 처리 (저장하지 않음)
    });
    
    return answers;
  };

  const drawResults = (circles: OMRCircle[]) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 원본 이미지 다시 그리기
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // 탐지된 원들 표시
      circles.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        
        if (circle.filled) {
          ctx.strokeStyle = '#22c55e'; // 초록색: 마킹됨
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#ef4444'; // 빨간색: 마킹 안됨
          ctx.lineWidth = 1;
        }
        
        ctx.stroke();
      });
    };
    img.src = imageUrl;
  };

  return (
    <div className="space-y-4">
      {/* 설정 패널 */}
      {showSettings && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">이진화 임계값</label>
              <span className="text-sm text-muted-foreground">{threshold[0]}</span>
            </div>
            <Slider
              value={threshold}
              onValueChange={setThreshold}
              max={255}
              min={0}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              낮은 값: 더 많은 영역을 어둡게 인식 | 높은 값: 더 적은 영역을 어둡게 인식
            </p>
          </CardContent>
        </Card>
      )}

      {/* 이미지 캔버스 */}
      <Card>
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto border rounded"
            style={{ maxHeight: '500px' }}
          />
        </CardContent>
      </Card>

      {/* 진행 상황 */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">처리 진행 상황</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2">
        <Button 
          onClick={processOMR} 
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              처리 중...
            </>
          ) : (
            '답안 추출 시작'
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* 탐지 결과 요약 */}
      {detectedCircles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">탐지된 원:</span>
                <span className="ml-2">{detectedCircles.length}개</span>
              </div>
              <div>
                <span className="font-medium">마킹된 원:</span>
                <span className="ml-2">{detectedCircles.filter(c => c.filled).length}개</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};