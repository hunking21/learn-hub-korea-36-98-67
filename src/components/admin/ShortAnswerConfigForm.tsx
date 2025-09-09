import { ShortAnswerProcessingRule } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, X } from "lucide-react";
import { useState } from "react";

interface ShortAnswerConfigFormProps {
  config: ShortAnswerProcessingRule;
  onChange: (config: ShortAnswerProcessingRule) => void;
}

export function ShortAnswerConfigForm({ config, onChange }: ShortAnswerConfigFormProps) {
  const [newRegexPattern, setNewRegexPattern] = useState("");

  const updateConfig = (updates: Partial<ShortAnswerProcessingRule>) => {
    onChange({ ...config, ...updates });
  };

  const addRegexPattern = () => {
    if (!newRegexPattern.trim()) return;
    
    try {
      // 정규식 유효성 검사
      new RegExp(newRegexPattern.trim());
      
      updateConfig({
        regexPatterns: [...config.regexPatterns, newRegexPattern.trim()]
      });
      setNewRegexPattern("");
    } catch (error) {
      alert("유효하지 않은 정규식입니다.");
    }
  };

  const removeRegexPattern = (index: number) => {
    updateConfig({
      regexPatterns: config.regexPatterns.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          주관식 채점 설정
        </CardTitle>
        <CardDescription>
          주관식 답안의 정답 처리 규칙을 설정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>공백 무시</Label>
              <p className="text-sm text-muted-foreground">
                답안의 앞뒤 공백을 무시합니다.
              </p>
            </div>
            <Switch
              checked={config.ignoreWhitespace}
              onCheckedChange={(checked) => updateConfig({ ignoreWhitespace: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>대소문자 구분 안함</Label>
              <p className="text-sm text-muted-foreground">
                영문자의 대소문자를 구분하지 않습니다.
              </p>
            </div>
            <Switch
              checked={config.ignoreCase}
              onCheckedChange={(checked) => updateConfig({ ignoreCase: checked })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="typo-tolerance">허용 오타 수</Label>
          <Input
            id="typo-tolerance"
            type="number"
            min="0"
            max="5"
            value={config.typoTolerance}
            onChange={(e) => updateConfig({
              typoTolerance: Math.max(0, Math.min(5, parseInt(e.target.value) || 0))
            })}
          />
          <p className="text-sm text-muted-foreground mt-1">
            정답으로 인정할 최대 오타 개수 (0-5개, 레벤시타인 거리 기준)
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>정규식 패턴 목록</Label>
            <p className="text-sm text-muted-foreground">
              정답으로 인정할 패턴을 정규식으로 추가할 수 있습니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="정규식 패턴을 입력하세요 (예: ^(네|예|yes|ok)$)"
              value={newRegexPattern}
              onChange={(e) => setNewRegexPattern(e.target.value)}
              className="min-h-[40px]"
            />
            <Button onClick={addRegexPattern} disabled={!newRegexPattern.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {config.regexPatterns.length > 0 && (
            <div className="space-y-2">
              <Label>등록된 패턴</Label>
              <div className="space-y-2">
                {config.regexPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs flex-1 justify-start">
                      {pattern}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRegexPattern(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">처리 규칙 요약</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 공백 처리: {config.ignoreWhitespace ? '무시함' : '포함함'}</p>
            <p>• 대소문자: {config.ignoreCase ? '구분 안함' : '구분함'}</p>
            <p>• 허용 오타: 최대 {config.typoTolerance}개</p>
            <p>• 정규식 패턴: {config.regexPatterns.length}개 등록됨</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}