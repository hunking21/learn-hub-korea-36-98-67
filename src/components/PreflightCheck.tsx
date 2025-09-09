import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Wifi, Mic, Volume2, Play, RotateCcw } from 'lucide-react';

interface PreflightResult {
  mic: boolean;
  record: boolean;
  play: boolean;
  net: {
    downKbps: number;
    upKbps: number;
  };
  checkedAt: string;
}

interface PreflightCheckProps {
  onComplete: (result: PreflightResult) => void;
  testName: string;
}

const PreflightCheck: React.FC<PreflightCheckProps> = ({ onComplete, testName }) => {
  const [stage, setStage] = useState<'idle' | 'checking' | 'complete'>('idle');
  const [results, setResults] = useState({
    mic: false,
    record: false,
    play: false,
    netDown: 0,
    netUp: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // 마이크 권한 확인
  const checkMicPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('마이크 권한 확인 실패:', error);
      setErrors(prev => ({ ...prev, mic: '마이크 권한이 허용되지 않았습니다.' }));
      return false;
    }
  };

  // 3초 녹음 테스트
  const testRecording = async (): Promise<boolean> => {
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

      const recordingPromise = new Promise<boolean>((resolve) => {
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setHasRecording(true);
          stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob.size > 0);
        };

        mediaRecorder.onerror = () => {
          stream.getTracks().forEach(track => track.stop());
          resolve(false);
        };
      });

      setIsRecording(true);
      mediaRecorder.start();

      // 3초 후 자동 정지
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 3000);

      return await recordingPromise;
    } catch (error) {
      console.error('녹음 테스트 실패:', error);
      setErrors(prev => ({ ...prev, record: '녹음 기능을 사용할 수 없습니다.' }));
      return false;
    }
  };

  // 재생 테스트
  const testPlayback = async (): Promise<boolean> => {
    if (!audioUrl) return false;
    
    try {
      const audio = new Audio(audioUrl);
      
      const playPromise = new Promise<boolean>((resolve) => {
        audio.oncanplaythrough = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.load();
      });

      return await playPromise;
    } catch (error) {
      console.error('재생 테스트 실패:', error);
      setErrors(prev => ({ ...prev, play: '오디오 재생 기능을 사용할 수 없습니다.' }));
      return false;
    }
  };

  // 네트워크 속도 테스트 (간단한 모의 테스트)
  const testNetwork = async (): Promise<{ down: number; up: number }> => {
    try {
      const start = Date.now();
      
      // 다운로드 테스트 - 작은 이미지 다운로드
      const response = await fetch('/favicon.ico?' + Math.random());
      if (!response.ok) throw new Error('Network test failed');
      
      const end = Date.now();
      const duration = end - start;
      
      // 간단한 속도 계산 (실제로는 더 정확한 측정이 필요)
      const downKbps = Math.round((1024 * 8) / (duration / 1000)); // 대략적인 계산
      const upKbps = Math.round(downKbps * 0.5); // 업로드는 다운로드의 50%로 가정
      
      return { down: Math.max(downKbps, 100), up: Math.max(upKbps, 50) };
    } catch (error) {
      console.error('네트워크 테스트 실패:', error);
      setErrors(prev => ({ ...prev, net: '네트워크 연결을 확인할 수 없습니다.' }));
      return { down: 0, up: 0 };
    }
  };

  // 전체 검사 실행
  const runFullCheck = async () => {
    setStage('checking');
    setErrors({});
    
    // 1. 마이크 권한 확인
    const micOk = await checkMicPermission();
    setResults(prev => ({ ...prev, mic: micOk }));
    
    if (!micOk) {
      setStage('complete');
      return;
    }

    // 2. 녹음 테스트
    const recordOk = await testRecording();
    setResults(prev => ({ ...prev, record: recordOk }));
    
    if (!recordOk) {
      setStage('complete');
      return;
    }

    // 3. 재생 테스트
    const playOk = await testPlayback();
    setResults(prev => ({ ...prev, play: playOk }));

    // 4. 네트워크 테스트
    const netResult = await testNetwork();
    setResults(prev => ({ ...prev, netDown: netResult.down, netUp: netResult.up }));

    setStage('complete');
  };

  // 수동 재생 테스트
  const manualPlayTest = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.play()
      .then(() => {
        setResults(prev => ({ ...prev, play: true }));
        toast({ title: "재생 테스트 완료", description: "오디오가 정상적으로 재생되었습니다." });
      })
      .catch(() => {
        setErrors(prev => ({ ...prev, play: '오디오 재생에 실패했습니다.' }));
        toast({ title: "재생 실패", description: "오디오 재생을 확인해주세요.", variant: "destructive" });
      });
  };

  // 검사 완료 처리
  const handleComplete = () => {
    const allPassed = results.mic && results.record && results.play && results.netDown > 0;
    
    if (allPassed) {
      const result: PreflightResult = {
        mic: results.mic,
        record: results.record,
        play: results.play,
        net: {
          downKbps: results.netDown,
          upKbps: results.netUp,
        },
        checkedAt: new Date().toISOString(),
      };
      onComplete(result);
    } else {
      toast({
        title: "장치 점검 미완료",
        description: "모든 항목을 통과해야 시험을 시작할 수 있습니다.",
        variant: "destructive",
      });
    }
  };

  // 검사 상태 아이콘
  const getStatusIcon = (passed: boolean, failed: boolean = false) => {
    if (failed) return <XCircle className="h-5 w-5 text-destructive" />;
    if (passed) return <CheckCircle className="h-5 w-5 text-success" />;
    return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  };

  const allPassed = results.mic && results.record && results.play && results.netDown > 0;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">장치 점검</h1>
            <p className="text-muted-foreground">
              {testName} 시작 전 시스템을 점검합니다
            </p>
          </div>

          {/* Progress Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>시스템 점검 진행상황</span>
                {stage === 'checking' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 마이크 권한 */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                    <span>마이크 권한</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.mic, !!errors.mic)}
                    {errors.mic && (
                      <Badge variant="destructive" className="text-xs">
                        실패
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 녹음 테스트 */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted'}`}></div>
                    <span>3초 녹음 테스트</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.record, !!errors.record)}
                    {errors.record && (
                      <Badge variant="destructive" className="text-xs">
                        실패
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 재생 테스트 */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <span>스피커 테스트</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.play, !!errors.play)}
                    {hasRecording && !results.play && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={manualPlayTest}
                        className="text-xs h-6"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        재생
                      </Button>
                    )}
                    {errors.play && (
                      <Badge variant="destructive" className="text-xs">
                        실패
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 네트워크 테스트 */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-muted-foreground" />
                    <span>네트워크 연결</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.netDown > 0, !!errors.net)}
                    {results.netDown > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {results.netDown}KB/s
                      </Badge>
                    )}
                    {errors.net && (
                      <Badge variant="destructive" className="text-xs">
                        실패
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {stage === 'idle' && (
                  <Button onClick={runFullCheck} className="w-full">
                    <Mic className="h-4 w-4 mr-2" />
                    장치 점검 시작
                  </Button>
                )}

                {stage === 'checking' && (
                  <div className="space-y-2">
                    <Progress value={
                      (results.mic ? 25 : 0) + 
                      (results.record ? 25 : 0) + 
                      (results.play ? 25 : 0) + 
                      (results.netDown > 0 ? 25 : 0)
                    } />
                    <p className="text-sm text-muted-foreground">
                      {isRecording ? '녹음 중...' : '점검 진행 중...'}
                    </p>
                  </div>
                )}

                {stage === 'complete' && (
                  <div className="space-y-4">
                    {allPassed ? (
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                        <div className="flex items-center gap-2 text-success mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">모든 점검 완료</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          시험을 시작할 수 있습니다.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive mb-2">
                          <XCircle className="h-5 w-5" />
                          <span className="font-medium">점검 실패</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {Object.entries(errors).map(([key, error]) => (
                            <p key={key}>• {error}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStage('idle');
                          setResults({ mic: false, record: false, play: false, netDown: 0, netUp: 0 });
                          setErrors({});
                          setHasRecording(false);
                          if (audioUrl) {
                            URL.revokeObjectURL(audioUrl);
                            setAudioUrl(null);
                          }
                        }}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        다시 점검
                      </Button>
                      <Button
                        onClick={handleComplete}
                        disabled={!allPassed}
                        className="flex-1"
                      >
                        시험 시작
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">점검 항목 안내</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 마이크: 음성 녹음을 위한 권한 확인</p>
              <p>• 녹음: 3초간 샘플 녹음 수행</p>
              <p>• 스피커: 녹음된 오디오 재생 확인</p>
              <p>• 네트워크: 인터넷 연결 상태 확인</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreflightCheck;