import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Play, Pause, Trash2, Volume2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface AudioFile {
  file: File;
  url: string;
  duration: number;
}

interface AudioUploaderProps {
  sectionId: string;
  currentAudio?: AudioFile | null;
  onAudioChange: (audio: AudioFile | null) => void;
  className?: string;
}

export function AudioUploader({ sectionId, currentAudio, onAudioChange, className = "" }: AudioUploaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "오류",
        description: "오디오 파일만 업로드할 수 있습니다.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "오류", 
        description: "파일 크기는 50MB 이하여야 합니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create blob URL for preview
      const url = URL.createObjectURL(file);
      
      // Get audio duration
      const audio = new Audio(url);
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
          const audioFile: AudioFile = {
            file,
            url,
            duration: audio.duration
          };
          onAudioChange(audioFile);
          resolve(audio.duration);
        };
        audio.onerror = reject;
      });

      toast({
        title: "성공",
        description: "오디오 파일이 업로드되었습니다."
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: "오류",
        description: "오디오 파일 업로드에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentAudio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !currentAudio) return;

    const newTime = (value[0] / 100) * currentAudio.duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const removeAudio = () => {
    if (currentAudio) {
      URL.revokeObjectURL(currentAudio.url);
      onAudioChange(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          오디오 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentAudio ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center space-y-4">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <div>
                <h4 className="font-medium">오디오 파일 업로드</h4>
                <p className="text-sm text-muted-foreground">
                  MP3, WAV, OGG 등의 오디오 파일을 선택하세요
                </p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()}>
                파일 선택
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Audio Info */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{currentAudio.file.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(currentAudio.duration)}</span>
                  <Badge variant="outline" className="text-xs">
                    {(currentAudio.file.size / (1024 * 1024)).toFixed(1)}MB
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  교체
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeAudio}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Audio Player */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <audio
                ref={audioRef}
                src={currentAudio.url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnd}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                preload="metadata"
              />
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                
                <div className="flex-1 space-y-1">
                  <Progress
                    value={progress}
                    className="h-2 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = (x / rect.width) * 100;
                      handleProgressChange([percentage]);
                    }}
                  />
                </div>
                
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Replace file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}