import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Volume2, RotateCcw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ListeningPlayerProps {
  audioUrl: string;
  sectionId: string;
  maxPlayCount?: number;
  allowPause?: boolean;
  onAudioEvent?: (event: {
    at: number;
    type: 'audio_start' | 'audio_end' | 'seek';
    sectionId: string;
    positionMs: number;
  }) => void;
  className?: string;
}

export function ListeningPlayer({
  audioUrl,
  sectionId,
  maxPlayCount = 1,
  allowPause = false,
  onAudioEvent,
  className = ""
}: ListeningPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSpeakerTest, setShowSpeakerTest] = useState(true);
  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);
  const lastPositionRef = useRef<number>(0);

  // Create secure blob URL to prevent direct access
  const [secureAudioUrl, setSecureAudioUrl] = useState<string>("");

  useEffect(() => {
    // Convert to blob URL for security
    const loadSecureAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setSecureAudioUrl(blobUrl);
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    if (audioUrl) {
      loadSecureAudio();
    }

    return () => {
      if (secureAudioUrl) {
        URL.revokeObjectURL(secureAudioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !secureAudioUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      // Preload audio
      audio.load();
    };

    const handleTimeUpdate = () => {
      const currentPos = audio.currentTime;
      setCurrentTime(currentPos);

      // Detect seeking (jump in position > 1 second)
      if (Math.abs(currentPos - lastPositionRef.current) > 1) {
        onAudioEvent?.({
          at: Date.now(),
          type: 'seek',
          sectionId,
          positionMs: Math.round(currentPos * 1000)
        });
      }
      lastPositionRef.current = currentPos;
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onAudioEvent?.({
        at: Date.now(),
        type: 'audio_start',
        sectionId,
        positionMs: Math.round(audio.currentTime * 1000)
      });
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlayCount(prev => prev + 1);
      onAudioEvent?.({
        at: Date.now(),
        type: 'audio_end',
        sectionId,
        positionMs: Math.round(audio.duration * 1000)
      });
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [secureAudioUrl, sectionId, onAudioEvent]);

  // Disable right-click context menu on audio
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('contextmenu', handleContextMenu);
      return () => audio.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    if (playCount >= maxPlayCount) {
      return; // Can't play anymore
    }

    if (isPlaying) {
      if (allowPause) {
        audio.pause();
      }
    } else {
      audio.play();
    }
  };

  const handleSpeakerTest = () => {
    const testAudio = testAudioRef.current;
    if (!testAudio) return;

    if (testAudioPlaying) {
      testAudio.pause();
      testAudio.currentTime = 0;
      setTestAudioPlaying(false);
    } else {
      testAudio.play();
      setTestAudioPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const canPlay = playCount < maxPlayCount && isLoaded;
  const remainingPlays = maxPlayCount - playCount;

  return (
    <>
      {/* Speaker Test Dialog */}
      <Dialog open={showSpeakerTest} onOpenChange={setShowSpeakerTest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              스피커 테스트
            </DialogTitle>
            <DialogDescription>
              시험을 시작하기 전에 스피커 또는 헤드폰 볼륨을 확인하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">테스트 음원 재생</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSpeakerTest}
                    className="gap-2"
                  >
                    {testAudioPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {testAudioPlaying ? '정지' : '재생'}
                  </Button>
                </div>
                <audio
                  ref={testAudioRef}
                  onEnded={() => setTestAudioPlaying(false)}
                  preload="auto"
                >
                  <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DwwHkpBSwFJHfH8N2QQAoUXrTp66hVFApGn+DwwHkpBSwFJHfH8N2QQAoUXrTp66hVFApGn+DwwHkpBSwFJHfH8N2QQAoUXrTp66hVFApGn+DwwHkpBSw=" type="audio/wav" />
                </audio>
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowSpeakerTest(false)}>
                테스트 완료
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Audio Player */}
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              듣기 문제
            </div>
            <div className="flex items-center gap-2">
              {maxPlayCount > 1 && (
                <Badge variant={remainingPlays > 0 ? "default" : "destructive"}>
                  {remainingPlays}회 재생 가능
                </Badge>
              )}
              {!allowPause && (
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  일시정지 불가
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {secureAudioUrl && (
            <audio
              ref={audioRef}
              src={secureAudioUrl}
              preload="auto"
              controlsList="nodownload nofullscreen noremoteplayback"
              style={{ display: 'none' }}
            />
          )}

          {!isLoaded ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">오디오 로딩 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Play Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={canPlay ? "default" : "secondary"}
                  size="lg"
                  onClick={togglePlayPause}
                  disabled={!canPlay}
                  className="gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-5 w-5" />
                      {allowPause ? '일시정지' : '재생중'}
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      재생
                    </>
                  )}
                </Button>

                {playCount >= maxPlayCount && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RotateCcw className="h-4 w-4" />
                    재생 횟수를 모두 사용했습니다
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Audio Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">재생 횟수</div>
                  <div className="text-2xl font-bold text-primary">
                    {playCount} / {maxPlayCount}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">총 길이</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              <div className="space-y-2">
                {!allowPause && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    <AlertTriangle className="h-3 w-3" />
                    재생 중 일시정지할 수 없습니다. 신중하게 재생하세요.
                  </div>
                )}
                {maxPlayCount === 1 && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    <AlertTriangle className="h-3 w-3" />
                    한 번만 재생할 수 있습니다. 재생 전 준비를 완료하세요.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}