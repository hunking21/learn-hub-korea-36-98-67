import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Bot, CheckCircle, RotateCcw, Play, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useSpeakingAutoGrading, type AutoSpeakingResult } from '@/hooks/useSpeakingAutoGrading';
import type { Question } from '@/types';
import { AudioPlayer } from '@/components/AudioPlayer';

interface SpeakingAutoGradingProps {
  question: Question;
  questionIndex: number;
  audioUrl?: string;
  existingResult?: AutoSpeakingResult;
  onAutoGradeComplete: (questionId: string, result: AutoSpeakingResult) => void;
  onApproveAutoScore: (questionId: string) => void;
}

export const SpeakingAutoGrading: React.FC<SpeakingAutoGradingProps> = ({
  question,
  questionIndex,
  audioUrl,
  existingResult,
  onAutoGradeComplete,
  onApproveAutoScore
}) => {
  const [result, setResult] = useState<AutoSpeakingResult | null>(existingResult || null);
  const { isProcessing, autoGrade, isSupported } = useSpeakingAutoGrading();

  const handleAutoGrade = async () => {
    if (!audioUrl) {
      toast.error('오디오 파일이 없습니다.');
      return;
    }

    try {
      const gradingResult = await autoGrade(audioUrl, question.prompt);
      setResult(gradingResult);
      onAutoGradeComplete(question.id, gradingResult);
      toast.success('자동 채점이 완료되었습니다.');
    } catch (error) {
      console.error('Auto grading failed:', error);
      toast.error(error instanceof Error ? error.message : '자동 채점에 실패했습니다.');
    }
  };

  const handleReGrade = async () => {
    setResult(null);
    await handleAutoGrade();
  };

  const handleApprove = () => {
    if (result) {
      onApproveAutoScore(question.id);
      toast.success('자동 점수가 최종 점수로 반영되었습니다.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 3.5) return 'text-green-600';
    if (score >= 2.5) return 'text-blue-600';
    if (score >= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOverallScore = () => {
    if (!result) return 0;
    return (result.scores.fluency + result.scores.pronunciation + result.scores.grammar + result.scores.content) / 4;
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="font-medium">자동 채점 미지원</div>
              <div className="text-sm opacity-90">
                이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해주세요.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Speaking 자동 채점 (Beta)
          </CardTitle>
          <Badge variant="outline">{question.points}점</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Question and Audio */}
        <div>
          <div className="text-sm font-medium mb-2">문제 {questionIndex + 1}</div>
          <div className="text-sm text-muted-foreground p-2 bg-background rounded border mb-3">
            {question.prompt}
          </div>
          {audioUrl && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Play className="w-4 h-4" />
              <span>학생 답변:</span>
              <AudioPlayer audioUrl={audioUrl} />
            </div>
          )}
        </div>

        {/* Auto Grade Button */}
        {!result && (
          <div className="flex justify-center">
            <Button
              onClick={handleAutoGrade}
              disabled={isProcessing || !audioUrl}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  자동 채점 중...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  자동 채점 시작
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(getOverallScore())}`}>
                {getOverallScore().toFixed(1)} / 4.0
              </div>
              <div className="text-sm text-muted-foreground">종합 점수</div>
              <Progress value={(getOverallScore() / 4) * 100} className="h-2 mt-2" />
            </div>

            <Separator />

            {/* Rubric Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className={`text-xl font-semibold ${getScoreColor(result.scores.fluency)}`}>
                  {result.scores.fluency}
                </div>
                <div className="text-xs text-muted-foreground">유창성</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-semibold ${getScoreColor(result.scores.pronunciation)}`}>
                  {result.scores.pronunciation}
                </div>
                <div className="text-xs text-muted-foreground">발음</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-semibold ${getScoreColor(result.scores.grammar)}`}>
                  {result.scores.grammar}
                </div>
                <div className="text-xs text-muted-foreground">문법</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-semibold ${getScoreColor(result.scores.content)}`}>
                  {result.scores.content}
                </div>
                <div className="text-xs text-muted-foreground">내용</div>
              </div>
            </div>

            <Separator />

            {/* Metrics */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">분석 지표</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>말 속도: {result.wpm} WPM</div>
                <div>발화 시간: {result.speakingTime}초</div>
                <div>정지 횟수: {result.pauses}회</div>
                <div>필러워드: {result.fillers}개</div>
                <div>어휘 다양도: {(result.ttr * 100).toFixed(1)}%</div>
                <div>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(result.scoredAt).toLocaleString('ko-KR')}
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div>
              <div className="text-sm font-medium mb-2">전사 텍스트</div>
              <div className="text-sm p-2 bg-background rounded border max-h-24 overflow-y-auto">
                {result.transcript || '인식된 텍스트가 없습니다.'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReGrade}
                disabled={isProcessing}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                다시 채점
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                자동점수 승인
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};