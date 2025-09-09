import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void;
  onTranscriptionChange: (text: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  questionIndex?: number; // 문제 인덱스 추가
}

const VideoRecorder = ({ 
  onRecordingComplete, 
  onTranscriptionChange,
  isRecording,
  setIsRecording,
  questionIndex = 0
}: VideoRecorderProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasRecording, setHasRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();

  // 타이머 관리
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // 스트림이 변경될 때 비디오 엘리먼트에 연결
  useEffect(() => {
    if (stream && previewRef.current) {
      console.log('스트림을 비디오 엘리먼트에 연결 중...');
      previewRef.current.srcObject = stream;
      
      const videoElement = previewRef.current;
      
      const handleLoadedMetadata = () => {
        console.log('비디오 메타데이터 로드됨');
        if (videoElement) {
          videoElement.play()
            .then(() => {
              console.log('비디오 재생 성공');
              setCameraReady(true);
            })
            .catch((error) => {
              console.error('비디오 재생 실패:', error);
              setCameraReady(true); // 사용자가 수동으로 재생할 수 있도록
            });
        }
      };

      const handleCanPlay = () => {
        console.log('비디오 재생 가능');
        setCameraReady(true);
      };

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [stream]);

  // 문제 인덱스가 변경될 때 상태 초기화
  useEffect(() => {
    console.log('문제 인덱스 변경됨:', questionIndex);
    resetRecording();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
  }, [questionIndex]);

  const initializeCamera = async () => {
    try {
      console.log('카메라 초기화 시작...');
      setCameraReady(false);
      
      // 브라우저 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('브라우저에서 카메라를 지원하지 않습니다');
      }

      console.log('getUserMedia 호출 중...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });

      console.log('미디어 스트림 획득 성공:', mediaStream);
      setStream(mediaStream);

      // useEffect가 스트림 연결을 처리하므로 여기서는 스트림만 설정
      console.log('initializeCamera에서 스트림 설정 완료');

      return mediaStream;
    } catch (error) {
      console.error('카메라 초기화 실패:', error);
      setCameraReady(false);
      
      let errorMessage = "카메라와 마이크 권한을 허용해주세요.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "카메라가 다른 애플리케이션에서 사용 중입니다.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = "요청한 카메라 설정을 지원하지 않습니다.";
        }
      }
      
      toast({
        title: "카메라 접근 실패",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const startRecording = async () => {
    try {
      let mediaStream = stream;
      
      // 스트림이 없으면 새로 생성
      if (!mediaStream) {
        mediaStream = await initializeCamera();
      }

      if (!mediaStream) {
        throw new Error('미디어 스트림을 가져올 수 없습니다');
      }

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm;codecs=vp9,opus' });
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
        setHasRecording(true);
        onRecordingComplete(videoBlob);
        
        // 스트림 정리
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setCameraReady(false);
        
        // 미리보기 정리
        if (previewRef.current) {
          previewRef.current.srcObject = null;
        }
      };

      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      setRecordingTime(0);
      setHasRecording(false);
      
    } catch (error) {
      console.error('녹화 시작 실패:', error);
      toast({
        title: "녹화 시작 실패",
        description: "녹화를 시작할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const resetRecording = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setHasRecording(false);
    setRecordingTime(0);
    onTranscriptionChange("");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* 녹화 상태 표시 */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
          )}
          <span className="font-medium">
            {isRecording 
              ? (isPaused ? '일시정지됨' : '녹화중...') 
              : hasRecording 
                ? '녹화 완료' 
                : stream 
                  ? '카메라 준비됨'
                  : '녹화 대기'}
          </span>
        </div>
        <div className="text-sm font-mono">
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* 카메라 미리보기 */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[256px] flex items-center justify-center">
        {stream ? (
          <>
            <video 
              ref={previewRef}
              autoPlay 
              muted 
              playsInline
              className={`w-full h-64 object-cover ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: 'scaleX(-1)' }}
              onLoadedMetadata={() => {
                console.log('비디오 메타데이터 로드됨 - onLoadedMetadata 이벤트');
                setCameraReady(true);
              }}
              onCanPlay={() => {
                console.log('비디오 재생 가능 - onCanPlay 이벤트');
                setCameraReady(true);
              }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <div className="text-sm">카메라 로딩 중...</div>
                </div>
              </div>
            )}
            {isRecording && cameraReady && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                REC
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-2">📹</div>
            <div>카메라를 시작하려면 녹화 버튼을 눌러주세요</div>
          </div>
        )}
      </div>

      {/* 녹화 컨트롤 버튼 */}
      <div className="flex gap-2 justify-center flex-wrap">
        {!isRecording && !hasRecording && (
          <>
            {!stream && (
              <Button
                onClick={initializeCamera}
                variant="outline"
                className="mb-2"
              >
                📹 카메라 켜기
              </Button>
            )}
            {stream && cameraReady && (
              <Button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                🔴 녹화 시작
              </Button>
            )}
          </>
        )}

        {isRecording && !isPaused && (
          <>
            <Button
              variant="secondary"
              onClick={pauseRecording}
            >
              ⏸️ 일시정지
            </Button>
            <Button
              variant="destructive"
              onClick={stopRecording}
            >
              ⏹️ 정지
            </Button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <Button
              onClick={resumeRecording}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              ▶️ 재개
            </Button>
            <Button
              variant="destructive"
              onClick={stopRecording}
            >
              ⏹️ 정지
            </Button>
          </>
        )}

        {hasRecording && (
          <Button
            variant="secondary"
            onClick={resetRecording}
          >
            🔄 다시 녹화
          </Button>
        )}
      </div>

      {/* 녹화된 비디오 재생 */}
      {videoUrl && (
        <div className="p-4 bg-academy-brown/5 border border-academy-brown/20 rounded-lg">
          <p className="text-sm text-academy-muted mb-2">녹화된 답안:</p>
          <video 
            ref={videoRef}
            controls 
            className="w-full max-h-64 rounded"
            src={videoUrl}
          >
            브라우저에서 비디오 재생을 지원하지 않습니다.
          </video>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="text-xs text-academy-muted space-y-1">
        <p>💡 팁: 밝은 곳에서 카메라를 정면으로 바라보고 명확하게 말씀해 주세요.</p>
        <p>⏱️ 권장 답변 시간: 30초 ~ 2분</p>
        <p>🎯 녹화가 완료되면 자동으로 저장됩니다.</p>
      </div>
    </div>
  );
};

export default VideoRecorder;