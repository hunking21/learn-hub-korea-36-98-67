import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AudioUploader } from "./AudioUploader";
import { Volume2, Settings, AlertTriangle } from "lucide-react";

interface AudioFile {
  file: File;
  url: string;
  duration: number;
}

interface AudioSettings {
  maxPlayCount: number;
  allowPause: boolean;
  requireSpeakerTest: boolean;
}

interface SectionAudioManagerProps {
  sectionId: string;
  sectionName: string;
  currentAudio?: AudioFile | null;
  audioSettings: AudioSettings;
  onAudioChange: (audio: AudioFile | null) => void;
  onSettingsChange: (settings: AudioSettings) => void;
  className?: string;
}

export function SectionAudioManager({
  sectionId,
  sectionName,
  currentAudio,
  audioSettings,
  onAudioChange,
  onSettingsChange,
  className = ""
}: SectionAudioManagerProps) {
  const handlePlayCountChange = (value: string) => {
    const count = parseInt(value) || 1;
    onSettingsChange({
      ...audioSettings,
      maxPlayCount: Math.max(1, Math.min(10, count))
    });
  };

  const handlePauseToggle = (checked: boolean) => {
    onSettingsChange({
      ...audioSettings,
      allowPause: checked
    });
  };

  const handleSpeakerTestToggle = (checked: boolean) => {
    onSettingsChange({
      ...audioSettings,
      requireSpeakerTest: checked
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            {sectionName} - 오디오 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            듣기 섹션의 오디오 파일과 재생 설정을 관리합니다.
          </p>
        </CardContent>
      </Card>

      {/* Audio Upload */}
      <AudioUploader
        sectionId={sectionId}
        currentAudio={currentAudio}
        onAudioChange={onAudioChange}
      />

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            재생 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Play Count Setting */}
          <div className="space-y-3">
            <Label htmlFor="playCount">재생 횟수 제한</Label>
            <div className="flex items-center gap-3">
              <Input
                id="playCount"
                type="number"
                min="1"
                max="10"
                value={audioSettings.maxPlayCount}
                onChange={(e) => handlePlayCountChange(e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">회</span>
              <Badge variant={audioSettings.maxPlayCount === 1 ? "destructive" : "secondary"}>
                {audioSettings.maxPlayCount === 1 ? "1회만 재생" : `최대 ${audioSettings.maxPlayCount}회`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              수험자가 오디오를 재생할 수 있는 최대 횟수입니다. (1-10회)
            </p>
          </div>

          <Separator />

          {/* Pause Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>일시정지 허용</Label>
              <p className="text-xs text-muted-foreground">
                수험자가 재생 중 오디오를 일시정지할 수 있도록 허용합니다.
              </p>
            </div>
            <Switch
              checked={audioSettings.allowPause}
              onCheckedChange={handlePauseToggle}
            />
          </div>

          <Separator />

          {/* Speaker Test Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>스피커 테스트 필수</Label>
              <p className="text-xs text-muted-foreground">
                시험 시작 전 수험자에게 스피커/헤드폰 테스트를 요구합니다.
              </p>
            </div>
            <Switch
              checked={audioSettings.requireSpeakerTest}
              onCheckedChange={handleSpeakerTestToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">설정 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-medium text-muted-foreground">재생 횟수</div>
              <div className="text-lg font-bold">최대 {audioSettings.maxPlayCount}회</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-medium text-muted-foreground">일시정지</div>
              <div className="text-lg font-bold">
                {audioSettings.allowPause ? '허용' : '금지'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-medium text-muted-foreground">스피커 테스트</div>
              <div className="text-lg font-bold">
                {audioSettings.requireSpeakerTest ? '필수' : '선택'}
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="mt-4 space-y-2">
            {audioSettings.maxPlayCount === 1 && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3" />
                1회 재생 제한: 수험자는 오디오를 한 번만 들을 수 있습니다.
              </div>
            )}
            {!audioSettings.allowPause && (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3" />
                일시정지 금지: 재생 중 오디오를 멈출 수 없습니다.
              </div>
            )}
            {!currentAudio && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3" />
                오디오 파일을 업로드해야 듣기 섹션이 활성화됩니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}