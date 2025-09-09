import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionAudioManager } from "./SectionAudioManager";
import { SectionQuestionManagement } from "./SectionQuestionManagement";
import { Volume2, FileText, ArrowLeft } from "lucide-react";

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

interface TestSection {
  id: string;
  version_id: string;
  name: string;
  description: string | null;
  order_index: number;
  time_limit_minutes: number | null;
  score_weight: number;
  created_at: string;
  question_count?: number;
}

interface ListeningSectionManagerProps {
  section: TestSection;
  onBack: () => void;
  onUpdate: () => void;
}

export function ListeningSectionManager({ section, onBack, onUpdate }: ListeningSectionManagerProps) {
  const [currentAudio, setCurrentAudio] = useState<AudioFile | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    maxPlayCount: 1,
    allowPause: false,
    requireSpeakerTest: true
  });

  // Load existing audio and settings (mock implementation)
  useEffect(() => {
    // In real implementation, load from database
    // For now, use localStorage for demo
    const savedSettings = localStorage.getItem(`audio_settings_${section.id}`);
    if (savedSettings) {
      setAudioSettings(JSON.parse(savedSettings));
    }
  }, [section.id]);

  const handleAudioChange = (audio: AudioFile | null) => {
    setCurrentAudio(audio);
    // In real implementation, save to database
    console.log('Audio updated for section:', section.id, audio?.file.name);
  };

  const handleSettingsChange = (settings: AudioSettings) => {
    setAudioSettings(settings);
    // In real implementation, save to database
    localStorage.setItem(`audio_settings_${section.id}`, JSON.stringify(settings));
    console.log('Audio settings updated for section:', section.id, settings);
  };

  const isListeningSection = section.name.includes('듣기') || 
                            section.name.includes('Listening') || 
                            section.name.toLowerCase().includes('listening');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  {section.name} 관리
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description || "섹션 설명이 없습니다"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>배점: {section.score_weight}%</span>
              {section.time_limit_minutes && (
                <span>• 시간: {section.time_limit_minutes}분</span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Management Tabs */}
      <Tabs defaultValue={isListeningSection ? "audio" : "questions"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audio" className="gap-2">
            <Volume2 className="h-4 w-4" />
            오디오 관리
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <FileText className="h-4 w-4" />
            문제 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audio">
          <SectionAudioManager
            sectionId={section.id}
            sectionName={section.name}
            currentAudio={currentAudio}
            audioSettings={audioSettings}
            onAudioChange={handleAudioChange}
            onSettingsChange={handleSettingsChange}
          />
        </TabsContent>

        <TabsContent value="questions">
          <SectionQuestionManagement
            section={section}
            onUpdate={onUpdate}
            onBack={() => {}} // 이미 상위에서 onBack을 처리하므로 빈 함수
          />
        </TabsContent>
      </Tabs>

      {/* Section Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">섹션 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-medium text-muted-foreground">문제 수</div>
              <div className="text-lg font-bold">{section.question_count || 0}개</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-medium text-muted-foreground">오디오</div>
              <div className="text-lg font-bold">
                {currentAudio ? '업로드됨' : '없음'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-medium text-muted-foreground">재생 횟수</div>
              <div className="text-lg font-bold">{audioSettings.maxPlayCount}회</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-medium text-muted-foreground">일시정지</div>
              <div className="text-lg font-bold">
                {audioSettings.allowPause ? '허용' : '금지'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}