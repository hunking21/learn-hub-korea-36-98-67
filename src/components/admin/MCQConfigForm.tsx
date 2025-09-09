import { MCQScoringConfig } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { useState } from "react";

interface MCQConfigFormProps {
  config: MCQScoringConfig;
  onChange: (config: MCQScoringConfig) => void;
}

export function MCQConfigForm({ config, onChange }: MCQConfigFormProps) {
  const [usePenalty, setUsePenalty] = useState(config.wrongPenalty !== undefined && config.wrongPenalty > 0);

  const updateConfig = (updates: Partial<MCQScoringConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          객관식 채점 설정
        </CardTitle>
        <CardDescription>
          객관식 문제의 기본 배점과 오답 처리 방식을 설정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="mcq-default-points">기본 배점</Label>
          <Input
            id="mcq-default-points"
            type="number"
            min="0"
            step="0.1"
            value={config.defaultPoints}
            onChange={(e) => updateConfig({
              defaultPoints: Math.max(0, parseFloat(e.target.value) || 0)
            })}
          />
          <p className="text-sm text-muted-foreground mt-1">
            각 객관식 문제의 기본 점수입니다.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>오답 감점 사용</Label>
            <p className="text-sm text-muted-foreground">
              틀린 답에 대해 점수를 차감할지 설정합니다.
            </p>
          </div>
          <Switch
            checked={usePenalty}
            onCheckedChange={(checked) => {
              setUsePenalty(checked);
              updateConfig({
                wrongPenalty: checked ? (config.wrongPenalty || 0.25) : undefined
              });
            }}
          />
        </div>

        {usePenalty && (
          <div>
            <Label htmlFor="mcq-wrong-penalty">오답 감점</Label>
            <Input
              id="mcq-wrong-penalty"
              type="number"
              min="0"
              step="0.1"
              value={config.wrongPenalty || 0}
              onChange={(e) => updateConfig({
                wrongPenalty: Math.max(0, parseFloat(e.target.value) || 0)
              })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              틀린 답에 대해 차감할 점수입니다. (0 = 감점 없음)
            </p>
          </div>
        )}

        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">점수 계산 예시</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 정답: +{config.defaultPoints}점</p>
            <p>• 오답: {usePenalty ? `-${config.wrongPenalty || 0}점` : '0점 (감점 없음)'}</p>
            <p>• 무응답: 0점</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}