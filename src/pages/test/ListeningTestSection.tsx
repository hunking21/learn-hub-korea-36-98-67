import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListeningPlayer } from "@/components/test/ListeningPlayer";
import { useTestAttemptEvents } from "@/hooks/useTestAttemptEvents";
import { ChevronLeft, ChevronRight, Clock, Volume2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
}

interface AudioSettings {
  maxPlayCount: number;
  allowPause: boolean;
  requireSpeakerTest: boolean;
}

interface ListeningTestSectionProps {
  sectionId: string;
  sectionName: string;
  questions: Question[];
  audioUrl: string;
  audioSettings: AudioSettings;
  attemptId: string;
  timeRemaining?: number;
  onAnswer: (questionId: string, answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  answers: Record<string, string>;
  canGoNext: boolean;
  canGoPrevious: boolean;
  className?: string;
}

export function ListeningTestSection({
  sectionId,
  sectionName,
  questions,
  audioUrl,
  audioSettings,
  attemptId,
  timeRemaining,
  onAnswer,
  onNext,
  onPrevious,
  answers,
  canGoNext,
  canGoPrevious,
  className = ""
}: ListeningTestSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { addAudioEvent, getAudioPlayCount } = useTestAttemptEvents(attemptId);

  const currentQuestion = questions[currentQuestionIndex];
  const playCount = getAudioPlayCount(sectionId);

  const handleAudioEvent = (event: {
    at: number;
    type: 'audio_start' | 'audio_end' | 'seek';
    sectionId: string;
    positionMs: number;
  }) => {
    addAudioEvent(event.type, event.sectionId, event.positionMs);
  };

  const handleAnswerSelect = (answer: string) => {
    onAnswer(currentQuestion.id, answer);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              {sectionName}
            </CardTitle>
            <div className="flex items-center gap-3">
              {timeRemaining !== undefined && (
                <Badge variant={timeRemaining < 300 ? "destructive" : "outline"} className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
              <Badge variant="secondary">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Audio Player */}
      <ListeningPlayer
        audioUrl={audioUrl}
        sectionId={sectionId}
        maxPlayCount={audioSettings.maxPlayCount}
        allowPause={audioSettings.allowPause}
        onAudioEvent={handleAudioEvent}
      />

      {/* Question Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">문제 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestionIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => goToQuestion(index)}
                className={`relative ${
                  answers[questions[index].id] ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {index + 1}
                {answers[questions[index].id] && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              문제 {currentQuestionIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-base leading-relaxed">
              {currentQuestion.question_text}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = answers[currentQuestion.id] === optionLabel;
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-4"
                    onClick={() => handleAnswerSelect(optionLabel)}
                  >
                    <span className="font-bold mr-3">{optionLabel}.</span>
                    <span>{option}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              이전 섹션
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={onNext}
              disabled={!canGoNext}
              className="gap-2"
            >
              다음 섹션
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-muted-foreground">답변 완료</div>
              <div className="text-2xl font-bold text-primary">
                {Object.keys(answers).length} / {questions.length}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">오디오 재생</div>
              <div className="text-2xl font-bold text-primary">
                {playCount} / {audioSettings.maxPlayCount}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">완료율</div>
              <div className="text-2xl font-bold text-primary">
                {Math.round((Object.keys(answers).length / questions.length) * 100)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}