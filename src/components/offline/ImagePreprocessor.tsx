import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCcw, RotateCw, Crop, Contrast, Save } from 'lucide-react';

interface ImagePreprocessorProps {
  imageUrl: string;
  onProcessed: (processedImageUrl: string) => void;
  onLog?: (message: string) => void;
}

interface PreprocessingSettings {
  rotation: number;
  brightness: number;
  contrast: number;
  threshold: number;
  perspective: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}

export const ImagePreprocessor = ({ imageUrl, onProcessed, onLog }: ImagePreprocessorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<PreprocessingSettings>({
    rotation: 0,
    brightness: 100,
    contrast: 100,
    threshold: 128,
    perspective: {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 100, y: 0 },
      bottomLeft: { x: 0, y: 100 },
      bottomRight: { x: 100, y: 100 }
    }
  });
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  useEffect(() => {
    loadImage();
  }, [imageUrl]);

  useEffect(() => {
    if (originalImage) {
      applyPreprocessing();
    }
  }, [settings, originalImage]);

  const loadImage = () => {
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      
      // 원본 이미지를 원본 캔버스에 그리기
      if (originalCanvasRef.current) {
        const canvas = originalCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        }
      }

      // 초기 원근 좌표 설정 (이미지 모서리)
      setSettings(prev => ({
        ...prev,
        perspective: {
          topLeft: { x: 0, y: 0 },
          topRight: { x: img.width, y: 0 },
          bottomLeft: { x: 0, y: img.height },
          bottomRight: { x: img.width, y: img.height }
        }
      }));

      onLog?.('이미지 로드 완료');
    };
    img.src = imageUrl;
  };

  const applyPreprocessing = () => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // 1. 회전 적용
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((settings.rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // 2. 밝기/대비 필터 적용
    ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%)`;
    ctx.drawImage(originalImage, 0, 0);
    ctx.restore();

    // 3. 원근 보정 (간단한 시뮬레이션)
    applyPerspectiveCorrection(ctx);

    // 4. 이진화 적용
    applyBinarization(ctx);

    onLog?.('이미지 전처리 적용 완료');
  };

  const applyPerspectiveCorrection = (ctx: CanvasRenderingContext2D) => {
    // 실제로는 복잡한 원근 변환 매트릭스를 적용해야 하지만
    // 여기서는 간단한 시뮬레이션만 구현
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    // 원근 보정 로직은 복잡하므로 여기서는 생략
    ctx.putImageData(imageData, 0, 0);
  };

  const applyBinarization = (ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // 그레이스케일 변환
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      // 이진화
      const binary = avg > settings.threshold ? 255 : 0;
      
      data[i] = binary;     // R
      data[i + 1] = binary; // G
      data[i + 2] = binary; // B
      // data[i + 3] = alpha 값은 유지
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const increment = direction === 'left' ? -90 : 90;
    setSettings(prev => ({
      ...prev,
      rotation: (prev.rotation + increment) % 360
    }));
  };

  const resetSettings = () => {
    setSettings({
      rotation: 0,
      brightness: 100,
      contrast: 100,
      threshold: 128,
      perspective: {
        topLeft: { x: 0, y: 0 },
        topRight: { x: originalImage?.width || 100, y: 0 },
        bottomLeft: { x: 0, y: originalImage?.height || 100 },
        bottomRight: { x: originalImage?.width || 100, y: originalImage?.height || 100 }
      }
    });
  };

  const saveProcessedImage = () => {
    if (!canvasRef.current) return;
    
    const processedUrl = canvasRef.current.toDataURL('image/png');
    onProcessed(processedUrl);
    onLog?.('처리된 이미지 저장 완료');
  };

  return (
    <div className="space-y-6">
      {/* 원본과 처리된 이미지 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">원본 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={originalCanvasRef}
              className="max-w-full h-auto border rounded"
              style={{ maxHeight: '300px' }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">처리된 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border rounded"
              style={{ maxHeight: '300px' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 조정 컨트롤 */}
      <Card>
        <CardHeader>
          <CardTitle>이미지 조정 도구</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 회전 컨트롤 */}
          <div className="flex items-center gap-4">
            <Label className="min-w-20">회전</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRotate('left')}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRotate('right')}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {settings.rotation}°
            </span>
          </div>

          {/* 밝기 조정 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>밝기</Label>
              <span className="text-sm text-muted-foreground">{settings.brightness}%</span>
            </div>
            <Slider
              value={[settings.brightness]}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, brightness: value }))}
              min={50}
              max={150}
              step={5}
              className="w-full"
            />
          </div>

          {/* 대비 조정 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>대비</Label>
              <span className="text-sm text-muted-foreground">{settings.contrast}%</span>
            </div>
            <Slider
              value={[settings.contrast]}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, contrast: value }))}
              min={50}
              max={150}
              step={5}
              className="w-full"
            />
          </div>

          {/* 이진화 임계값 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>이진화 임계값</Label>
              <span className="text-sm text-muted-foreground">{settings.threshold}</span>
            </div>
            <Slider
              value={[settings.threshold]}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, threshold: value }))}
              min={0}
              max={255}
              step={1}
              className="w-full"
            />
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetSettings}>
              초기화
            </Button>
            <Button onClick={saveProcessedImage} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              처리 완료
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};