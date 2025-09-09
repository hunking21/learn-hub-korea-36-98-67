import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionChange: (text: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  questionId?: string; // 문제 ID 추가
  disabled?: boolean;
}

const VoiceRecorder = ({ 
  onRecordingComplete, 
  onTranscriptionChange,
  isRecording,
  setIsRecording,
  questionId,
  disabled = false
}: VoiceRecorderProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasRecording, setHasRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  // 문제 ID가 변경될 때 상태 초기화
  useEffect(() => {
    if (questionId) {
      console.log('문제 ID 변경됨:', questionId);
      resetRecording();
    }
  }, [questionId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setHasRecording(true);
        onRecordingComplete(audioBlob);
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      setRecordingTime(0);
      setHasRecording(false);
      
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      toast({
        title: "마이크 접근 실패",
        description: "마이크 권한을 허용해주세요.",
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
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setHasRecording(false);
    setRecordingTime(0);
    onTranscriptionChange(""); // 텍스트 초기화
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* 녹음 상태 표시 */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
          )}
          <span className="font-medium">
            {isRecording 
              ? (isPaused ? '일시정지됨' : '녹음중...') 
              : hasRecording 
                ? '녹음 완료' 
                : '녹음 대기'}
          </span>
        </div>
        <div className="text-sm font-mono">
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* 녹음 컨트롤 버튼 */}
      <div className="flex gap-2 justify-center">
        {!isRecording && !hasRecording && (
          <Button
            onClick={startRecording}
            disabled={disabled}
            className="bg-red-500 hover:bg-red-600 text-white disabled:bg-muted disabled:text-muted-foreground"
          >
            🎤 녹음 시작
          </Button>
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
            🔄 다시 녹음
          </Button>
        )}
      </div>

      {/* 녹음된 오디오 재생 */}
      {audioUrl && (
        <div className="p-4 bg-academy-brown/5 border border-academy-brown/20 rounded-lg">
          <p className="text-sm text-academy-muted mb-2">녹음된 답안:</p>
          <audio 
            controls 
            className="w-full"
            src={audioUrl}
          >
            브라우저에서 오디오 재생을 지원하지 않습니다.
          </audio>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="text-xs text-academy-muted space-y-1">
        <p>💡 팁: 조용한 환경에서 명확하게 말씀해 주세요.</p>
        <p>⏱️ 권장 답변 시간: 30초 ~ 2분</p>
        <p>🎯 녹음이 완료되면 자동으로 저장됩니다.</p>
      </div>
    </div>
  );
};

export default VoiceRecorder;