import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import type { SpeakingRubric, RubricCriterion } from '@/types';

interface SpeakingRubricProps {
  questionId: string;
  maxPoints: number;
  rubric: SpeakingRubric;
  onRubricChange: (questionId: string, rubric: SpeakingRubric) => void;
}

const RUBRIC_CRITERIA = {
  fluency: {
    label: 'Fluency (유창성)',
    descriptions: {
      0: '말하기 시도하지 않음',
      1: '자주 멈추고 주저함, 매우 느린 속도',
      2: '때때로 멈추지만 기본적인 의사소통 가능',
      3: '대체로 자연스럽고 적절한 속도',
      4: '매우 자연스럽고 원어민 수준의 유창성'
    }
  },
  pronunciation: {
    label: 'Pronunciation (발음)',
    descriptions: {
      0: '발음 시도하지 않음',
      1: '대부분 이해하기 어려운 발음',
      2: '몇 가지 발음 오류가 있지만 이해 가능',
      3: '대체로 정확한 발음, 약간의 실수',
      4: '매우 정확하고 자연스러운 발음'
    }
  },
  grammar: {
    label: 'Grammar (문법)',
    descriptions: {
      0: '문법 사용하지 않음',
      1: '기본 문법 구조도 부정확',
      2: '단순한 문법은 사용하나 복잡한 구조에서 오류',
      3: '대체로 정확한 문법, 복잡한 구조도 시도',
      4: '매우 정확하고 다양한 문법 구조 사용'
    }
  },
  content: {
    label: 'Content (내용)',
    descriptions: {
      0: '내용 없음',
      1: '주제와 관련없거나 매우 부족한 내용',
      2: '기본적인 내용이지만 부족함',
      3: '적절한 내용과 아이디어 포함',
      4: '풍부하고 창의적인 내용, 논리적 구성'
    }
  }
} as const;

export function SpeakingRubricForm({ questionId, maxPoints, rubric, onRubricChange }: SpeakingRubricProps) {
  const handleCriterionChange = (key: RubricCriterion['key'], score: number) => {
    const updatedCriteria = rubric.criteria.map(criterion =>
      criterion.key === key ? { ...criterion, score } : criterion
    );
    
    onRubricChange(questionId, {
      ...rubric,
      criteria: updatedCriteria
    });
  };

  const handleWeightChange = (key: RubricCriterion['key'], weight: number) => {
    const updatedCriteria = rubric.criteria.map(criterion =>
      criterion.key === key ? { ...criterion, weight } : criterion
    );
    
    onRubricChange(questionId, {
      ...rubric,
      criteria: updatedCriteria
    });
  };

  const handleCommentChange = (comment: string) => {
    onRubricChange(questionId, {
      ...rubric,
      comment
    });
  };

  const calculateWeightedScore = () => {
    const totalScore = rubric.criteria.reduce((sum, criterion) => 
      sum + (criterion.score * criterion.weight / 100), 0
    );
    return Math.round((totalScore / 4) * maxPoints * 100) / 100;
  };

  const totalWeight = rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Score Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Rubric 채점 결과
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={totalWeight === 100 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}>
                  가중치: {totalWeight}%
                </Badge>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {calculateWeightedScore()} / {maxPoints}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {totalWeight !== 100 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ 가중치 합계가 100%가 아닙니다. 정확한 점수 계산을 위해 조정해주세요.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Rubric Criteria */}
        <div className="grid gap-6">
          {rubric.criteria.map((criterion) => {
            const criteriaInfo = RUBRIC_CRITERIA[criterion.key];
            return (
              <Card key={criterion.key} className="p-4">
                <div className="space-y-4">
                  {/* Criterion Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">{criteriaInfo.label}</h4>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-2 text-xs">
                            {Object.entries(criteriaInfo.descriptions).map(([score, desc]) => (
                              <div key={score}>
                                <strong>{score}점:</strong> {desc}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge variant="secondary">{criterion.score}/4</Badge>
                  </div>

                  {/* Score Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">점수 선택</Label>
                    <RadioGroup
                      value={criterion.score.toString()}
                      onValueChange={(value) => handleCriterionChange(criterion.key, parseInt(value))}
                      className="flex gap-6"
                    >
                      {[0, 1, 2, 3, 4].map((score) => (
                        <div key={score} className="flex items-center space-x-2">
                          <RadioGroupItem value={score.toString()} id={`${criterion.key}-${score}`} />
                          <Label 
                            htmlFor={`${criterion.key}-${score}`} 
                            className="text-sm cursor-pointer hover:text-primary"
                          >
                            {score}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    {/* Current description */}
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <strong>{criterion.score}점:</strong> {criteriaInfo.descriptions[criterion.score as keyof typeof criteriaInfo.descriptions]}
                    </div>
                  </div>

                  {/* Weight Adjustment */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">가중치 (%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[criterion.weight]}
                        onValueChange={([value]) => handleWeightChange(criterion.key, value)}
                        max={100}
                        min={0}
                        step={5}
                        className="flex-1"
                      />
                      <div className="w-16 text-center">
                        <Badge variant="outline">{criterion.weight}%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Overall Comment */}
        <Card className="p-4">
          <div className="space-y-3">
            <Label htmlFor={`comment-${questionId}`} className="text-sm font-medium">
              종합 코멘트
            </Label>
            <Textarea
              id={`comment-${questionId}`}
              value={rubric.comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="학생의 스피킹 능력에 대한 종합적인 피드백을 작성해주세요..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}