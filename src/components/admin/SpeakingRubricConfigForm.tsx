import { SpeakingRubricItem } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface SpeakingRubricConfigFormProps {
  rubrics: SpeakingRubricItem[];
  onChange: (rubrics: SpeakingRubricItem[]) => void;
}

export function SpeakingRubricConfigForm({ rubrics, onChange }: SpeakingRubricConfigFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalWeight = rubrics.reduce((sum, rubric) => sum + rubric.weight, 0);
  const isWeightValid = totalWeight === 100;

  const addRubric = () => {
    const newRubric: SpeakingRubricItem = {
      id: crypto.randomUUID(),
      label: '새 평가 항목',
      description: '',
      weight: Math.max(0, 100 - totalWeight),
      maxScore: 4
    };
    
    onChange([...rubrics, newRubric]);
    setEditingId(newRubric.id);
  };

  const updateRubric = (id: string, updates: Partial<SpeakingRubricItem>) => {
    onChange(rubrics.map(rubric => 
      rubric.id === id ? { ...rubric, ...updates } : rubric
    ));
  };

  const deleteRubric = (id: string) => {
    onChange(rubrics.filter(rubric => rubric.id !== id));
  };

  const redistributeWeights = () => {
    if (rubrics.length === 0) return;
    
    const equalWeight = Math.floor(100 / rubrics.length);
    const remainder = 100 - (equalWeight * rubrics.length);
    
    onChange(rubrics.map((rubric, index) => ({
      ...rubric,
      weight: equalWeight + (index < remainder ? 1 : 0)
    })));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          말하기 루브릭 설정
        </CardTitle>
        <CardDescription>
          말하기 평가를 위한 루브릭 항목을 관리합니다. 총 가중치는 100%여야 합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">총 가중치:</span>
            <Badge variant={isWeightValid ? "default" : "destructive"}>
              {totalWeight}%
            </Badge>
            {!isWeightValid && (
              <div className="flex items-center gap-1 text-destructive text-sm">
                <AlertTriangle className="h-3 w-3" />
                <span>100%가 되어야 합니다</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={redistributeWeights}
              disabled={rubrics.length === 0}
            >
              균등 배분
            </Button>
            <Button onClick={addRubric}>
              <Plus className="h-4 w-4 mr-1" />
              항목 추가
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {rubrics.map((rubric) => (
            <Card key={rubric.id} className={editingId === rubric.id ? "ring-2 ring-primary" : ""}>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`label-${rubric.id}`}>평가 항목명</Label>
                    <Input
                      id={`label-${rubric.id}`}
                      value={rubric.label}
                      onChange={(e) => updateRubric(rubric.id, { label: e.target.value })}
                      onFocus={() => setEditingId(rubric.id)}
                      onBlur={() => setEditingId(null)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`weight-${rubric.id}`}>가중치 (%)</Label>
                    <Input
                      id={`weight-${rubric.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={rubric.weight}
                      onChange={(e) => updateRubric(rubric.id, {
                        weight: Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                      })}
                      onFocus={() => setEditingId(rubric.id)}
                      onBlur={() => setEditingId(null)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`maxScore-${rubric.id}`}>최대 점수</Label>
                    <Input
                      id={`maxScore-${rubric.id}`}
                      type="number"
                      min="1"
                      max="10"
                      value={rubric.maxScore}
                      onChange={(e) => updateRubric(rubric.id, {
                        maxScore: Math.max(1, Math.min(10, parseInt(e.target.value) || 4))
                      })}
                      onFocus={() => setEditingId(rubric.id)}
                      onBlur={() => setEditingId(null)}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRubric(rubric.id)}
                      disabled={rubrics.length <= 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <Label htmlFor={`description-${rubric.id}`}>설명</Label>
                  <Textarea
                    id={`description-${rubric.id}`}
                    placeholder="이 평가 항목에 대한 설명을 입력하세요"
                    value={rubric.description}
                    onChange={(e) => updateRubric(rubric.id, { description: e.target.value })}
                    onFocus={() => setEditingId(rubric.id)}
                    onBlur={() => setEditingId(null)}
                    className="min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rubrics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>루브릭 항목이 없습니다.</p>
            <p className="text-sm">평가 항목을 추가하여 시작하세요.</p>
          </div>
        )}

        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">루브릭 요약</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 총 평가 항목: {rubrics.length}개</p>
            <p>• 총 가중치: {totalWeight}% {isWeightValid ? '✓' : '⚠️'}</p>
            <p>• 점수 범위: 0 - {Math.max(...rubrics.map(r => r.maxScore), 0)}점</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}