import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Question, TestAttempt, ScoringProfile } from '@/types';
import { shortAnswerGradingUtils } from '@/utils/shortAnswerGrading';

interface ShortAnswerReviewProps {
  question: Question;
  questionIndex: number;
  userAnswer: string;
  currentProfile: ScoringProfile;
  onAddToAnswerKey: (questionId: string, newAnswer: string) => void;
  isCorrect: boolean;
  attemptId: string;
}

export const ShortAnswerReview: React.FC<ShortAnswerReviewProps> = ({
  question,
  questionIndex,
  userAnswer,
  currentProfile,
  onAddToAnswerKey,
  isCorrect,
  attemptId
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToAnswerKey = async () => {
    if (!userAnswer?.trim()) {
      toast.error('추가할 답안이 없습니다.');
      return;
    }

    setIsAdding(true);
    
    try {
      await onAddToAnswerKey(question.id, userAnswer.trim());
      toast.success('답안이 정답 목록에 추가되었습니다.');
    } catch (error) {
      console.error('Failed to add answer to key:', error);
      toast.error('정답 목록 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const getCurrentAnswers = () => {
    if (!question.answer) return [];
    return Array.isArray(question.answer) ? question.answer : [String(question.answer)];
  };

  const processedUserAnswer = shortAnswerGradingUtils.processAnswer(userAnswer || '', currentProfile.shortConfig);
  const currentAnswers = getCurrentAnswers();

  return (
    <Card className={`${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            문제 {questionIndex + 1} (서술형)
          </CardTitle>
          <Badge variant="outline">{question.points}점</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">문제 내용</Label>
          <div className="text-sm text-muted-foreground mt-1 p-2 bg-background rounded border">
            {question.prompt}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">학생 답안</Label>
            <div className={`text-sm mt-1 p-2 rounded border ${
              isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              {userAnswer || '답안 없음'}
            </div>
            {userAnswer && (
              <div className="text-xs text-muted-foreground mt-1">
                처리된 답안: "{processedUserAnswer}"
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">등록된 정답</Label>
            <div className="space-y-2 mt-1">
              {currentAnswers.length > 0 ? (
                currentAnswers.map((answer, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {answer}
                  </Badge>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">등록된 정답이 없습니다</div>
              )}
            </div>
          </div>
        </div>

        {/* 채점 규칙 정보 */}
        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">현재 채점 규칙</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 공백 처리: {currentProfile.shortConfig.ignoreWhitespace ? '무시함' : '포함함'}</p>
            <p>• 대소문자: {currentProfile.shortConfig.ignoreCase ? '구분 안함' : '구분함'}</p>
            <p>• 허용 오타: 최대 {currentProfile.shortConfig.typoTolerance}개</p>
            <p>• 정규식 패턴: {currentProfile.shortConfig.regexPatterns.length}개</p>
          </div>
        </div>

        {/* Add to Answer Key Button */}
        {!isCorrect && userAnswer?.trim() && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              이 답안을 정답으로 인정하시겠습니까?
            </div>
            <Button
              size="sm"
              onClick={handleAddToAnswerKey}
              disabled={isAdding}
              className="flex items-center gap-2"
            >
              {isAdding ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isAdding ? '추가 중...' : '정답 목록에 추가'}
            </Button>
          </div>
        )}

        {isCorrect && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">정답입니다</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};