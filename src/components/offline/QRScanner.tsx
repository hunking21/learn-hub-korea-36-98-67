import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, RefreshCw } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { toast } from 'sonner';

interface QRScannerProps {
  mode?: 'camera' | 'upload';
  onQRScanned: (data: { testId: string; versionId: string; layoutSeed: number; numQuestions: number }) => void;
  onImageCapture: (imageUrl: string) => void;
}

export const QRScanner = ({ mode = 'camera', onQRScanned, onImageCapture }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    if (mode === 'camera' && videoRef.current) {
      initCamera();
    }
    
    return () => {
      if (qrScanner) {
        qrScanner.destroy();
      }
    };
  }, [mode]);

  const initCamera = async () => {
    if (!videoRef.current) return;

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleQRResult(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          overlay: document.createElement('div')
        }
      );

      setQrScanner(scanner);
      await scanner.start();
      setIsScanning(true);
      setHasCamera(true);
    } catch (error) {
      console.error('카메라 초기화 실패:', error);
      setHasCamera(false);
      toast.error('카메라에 접근할 수 없습니다. 파일 업로드를 이용해주세요.');
    }
  };

  const handleQRResult = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.testId && parsed.versionId && parsed.layoutSeed !== undefined && parsed.numQuestions) {
        onQRScanned(parsed);
        if (qrScanner) {
          qrScanner.stop();
          setIsScanning(false);
        }
        captureImage();
      } else {
        toast.error('올바른 시험 QR 코드가 아닙니다');
      }
    } catch (error) {
      toast.error('QR 코드를 읽을 수 없습니다');
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        onImageCapture(imageUrl);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    try {
      // 이미지를 Data URL로 변환
      const imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // QR 코드 스캔 시도
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      handleQRResult(result.data);
      onImageCapture(imageUrl);
      
    } catch (error) {
      console.error('파일 처리 실패:', error);
      toast.error('QR 코드를 찾을 수 없습니다. 이미지가 선명한지 확인해주세요.');
    }
  };

  const toggleCamera = async () => {
    if (!qrScanner) return;

    if (isScanning) {
      await qrScanner.stop();
      setIsScanning(false);
    } else {
      await qrScanner.start();
      setIsScanning(true);
    }
  };

  if (mode === 'upload') {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25">
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">답안지 이미지 업로드</p>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              QR 코드가 포함된 답안지 이미지를 선택해주세요
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              파일 선택
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasCamera ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-md mx-auto rounded-lg"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-primary rounded-lg animate-pulse" />
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                onClick={toggleCamera}
                variant={isScanning ? "destructive" : "default"}
              >
                {isScanning ? (
                  <>정지</>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    시작
                  </>
                )}
              </Button>
              
              {!isScanning && (
                <Button variant="outline" onClick={initCamera}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  재시도
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Camera className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">카메라 사용 불가</p>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              카메라에 접근할 수 없습니다. 파일 업로드 탭을 이용해주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};