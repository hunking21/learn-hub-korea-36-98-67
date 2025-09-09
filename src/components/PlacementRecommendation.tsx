import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { placementUtils } from '@/utils/placementUtils';
import type { PlacementRecommendation } from '@/types';

interface PlacementRecommendationProps {
  recommendation: PlacementRecommendation;
  className?: string;
  showDetails?: boolean;
}

export function PlacementRecommendationCard({ 
  recommendation, 
  className = '', 
  showDetails = true 
}: PlacementRecommendationProps) {
  const { level, totalScore, maxTotalScore, speakingScore, maxSpeakingScore, reason, confidence } = recommendation;

  return (
    <Card className={`border-2 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          배치 권고
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold flex items-center gap-2">
              <Badge className={`text-lg px-3 py-1 ${placementUtils.getLevelColor(level)}`}>
                {placementUtils.getLevelName(level)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              권고 레벨
            </div>
          </div>
          <div className="text-right">
            <Badge className={placementUtils.getConfidenceColor(confidence)}>
              신뢰도: {placementUtils.getConfidenceName(confidence)}
            </Badge>
          </div>
        </div>

        {showDetails && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">총점</span>
                <span className="font-medium">
                  {totalScore} / {maxTotalScore}점 ({Math.round((totalScore / maxTotalScore) * 100)}%)
                </span>
              </div>
              
              {speakingScore !== undefined && maxSpeakingScore !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">스피킹 평균</span>
                  <span className="font-medium">
                    {speakingScore} / {maxSpeakingScore}점
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium text-foreground mb-1">권고 근거</div>
                  <div className="text-muted-foreground">{reason}</div>
                </div>
              </div>
            </div>

            {confidence === 'low' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <div className="font-medium mb-1">낮은 신뢰도</div>
                    <div>
                      기준점에 아슬아슬하게 도달했습니다. 
                      추가 평가나 면담을 통해 정확한 레벨을 확인하는 것을 권장합니다.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}