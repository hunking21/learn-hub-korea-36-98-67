import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit, Trash2, Target, Award, Save, X } from 'lucide-react';
import { usePlacementConfig } from '@/hooks/usePlacementConfig';
import { placementUtils } from '@/utils/placementUtils';
import type { PlacementConfig, PlacementCriteria, PlacementLevel } from '@/types';
import { toast } from 'sonner';

const LEVELS: PlacementLevel[] = ['Starter', 'Basic', 'Intermediate', 'Advanced'];

export default function PlacementManagement() {
  const { configs, currentConfig, loading, createConfig, updateConfig, deleteConfig, setDefaultConfig } = usePlacementConfig();
  const [selectedConfig, setSelectedConfig] = useState<PlacementConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<PlacementConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: [] as PlacementCriteria[]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria: LEVELS.map(level => ({
        level,
        minTotalScore: 0,
        minSpeakingScore: 0,
        description: ''
      }))
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreating(true);
    setEditingConfig(null);
  };

  const openEditDialog = (config: PlacementConfig) => {
    setFormData({
      name: config.name,
      description: config.description || '',
      criteria: [...config.criteria]
    });
    setEditingConfig(config);
    setIsCreating(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('배치 기준 이름을 입력해주세요.');
        return;
      }

      if (formData.criteria.length === 0) {
        toast.error('최소 하나의 레벨 기준을 설정해주세요.');
        return;
      }

      // Validate criteria
      const sortedCriteria = [...formData.criteria].sort((a, b) => a.minTotalScore - b.minTotalScore);
      for (let i = 1; i < sortedCriteria.length; i++) {
        if (sortedCriteria[i].minTotalScore <= sortedCriteria[i-1].minTotalScore) {
          toast.error('각 레벨의 최소 점수는 이전 레벨보다 높아야 합니다.');
          return;
        }
      }

      if (editingConfig) {
        await updateConfig(editingConfig.id, {
          name: formData.name,
          description: formData.description,
          criteria: formData.criteria
        });
        toast.success('배치 기준이 수정되었습니다.');
      } else {
        await createConfig({
          name: formData.name,
          description: formData.description,
          criteria: formData.criteria,
          isDefault: false
        });
        toast.success('배치 기준이 생성되었습니다.');
      }

      setEditingConfig(null);
      setIsCreating(false);
    } catch (error) {
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 배치 기준을 삭제하시겠습니까?')) {
      try {
        await deleteConfig(id);
        toast.success('배치 기준이 삭제되었습니다.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다.');
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultConfig(id);
      toast.success('기본 배치 기준으로 설정되었습니다.');
    } catch (error) {
      toast.error('설정에 실패했습니다.');
    }
  };

  const updateCriteria = (level: PlacementLevel, field: keyof PlacementCriteria, value: any) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => 
        c.level === level ? { ...c, [field]: value } : c
      )
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-8 w-8" />
              배치 권고 관리
            </h1>
            <p className="text-muted-foreground mt-2">
              학생들의 시험 결과에 따른 레벨 배치 기준을 관리합니다.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            새 배치 기준
          </Button>
        </div>

        <Tabs defaultValue="configs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="configs">배치 기준 관리</TabsTrigger>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
          </TabsList>

          <TabsContent value="configs" className="space-y-6">
            {/* Current Default Config */}
            {currentConfig && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    현재 기본 배치 기준
                    <Badge variant="default">기본</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{currentConfig.name}</h3>
                      {currentConfig.description && (
                        <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {currentConfig.criteria.map(criteria => (
                        <div key={criteria.level} className="p-3 rounded-lg bg-background border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{placementUtils.getLevelName(criteria.level)}</span>
                            <Badge className={placementUtils.getLevelColor(criteria.level)}>
                              {criteria.level}
                            </Badge>
                          </div>
                          <div className="text-xs space-y-1 text-muted-foreground">
                            <div>총점: {criteria.minTotalScore}점 이상</div>
                            {criteria.minSpeakingScore !== undefined && (
                              <div>스피킹: {criteria.minSpeakingScore}점 이상</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Configs */}
            <Card>
              <CardHeader>
                <CardTitle>모든 배치 기준</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {configs.map(config => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{config.name}</h3>
                          {config.isDefault && <Badge variant="default">기본</Badge>}
                        </div>
                        {config.description && (
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {config.criteria.length}개 레벨 기준 • {new Date(config.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!config.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(config.id)}
                          >
                            기본으로 설정
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {config.id !== 'default' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>배치 권고 미리보기</CardTitle>
                <p className="text-sm text-muted-foreground">
                  다양한 점수 시나리오에서 배치 권고가 어떻게 작동하는지 확인합니다.
                </p>
              </CardHeader>
              <CardContent>
                {currentConfig && (
                  <div className="space-y-4">
                    {[
                      { total: 95, speaking: 3.8 },
                      { total: 75, speaking: 3.2 },
                      { total: 55, speaking: 2.5 },
                      { total: 25, speaking: 1.8 }
                    ].map((scenario, index) => {
                      // Create mock attempt for testing
                      const mockAttempt = {
                        finalTotal: scenario.total,
                        maxTotal: 100,
                        speakingReviews: [
                          { questionId: 'test', manualScore: scenario.speaking, comment: '' }
                        ]
                      } as any;
                      
                      const recommendation = placementUtils.calculatePlacement(mockAttempt, currentConfig);
                      
                      return (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <div className="font-medium">총점: {scenario.total}점</div>
                                <div className="text-muted-foreground">스피킹: {scenario.speaking}점</div>
                              </div>
                            </div>
                            {recommendation && (
                              <div className="flex items-center gap-2">
                                <Badge className={placementUtils.getLevelColor(recommendation.level)}>
                                  {placementUtils.getLevelName(recommendation.level)}
                                </Badge>
                                <Badge className={placementUtils.getConfidenceColor(recommendation.confidence)}>
                                  신뢰도: {placementUtils.getConfidenceName(recommendation.confidence)}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreating || !!editingConfig} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingConfig(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? '배치 기준 수정' : '새 배치 기준 생성'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">기준 이름 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="배치 기준 이름을 입력하세요"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="배치 기준에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">레벨별 기준 설정</h3>
                <div className="space-y-6">
                  {LEVELS.map(level => {
                    const criteria = formData.criteria.find(c => c.level === level) || {
                      level,
                      minTotalScore: 0,
                      minSpeakingScore: 0,
                      description: ''
                    };

                    return (
                      <Card key={level}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Badge className={placementUtils.getLevelColor(level)}>
                              {placementUtils.getLevelName(level)} ({level})
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>최소 총점 (100점 만점)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={criteria.minTotalScore}
                                onChange={(e) => updateCriteria(level, 'minTotalScore', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label>최소 스피킹 점수 (4점 만점, 선택사항)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="4"
                                step="0.1"
                                value={criteria.minSpeakingScore || ''}
                                onChange={(e) => updateCriteria(level, 'minSpeakingScore', parseFloat(e.target.value) || undefined)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>레벨 설명</Label>
                            <Textarea
                              value={criteria.description}
                              onChange={(e) => updateCriteria(level, 'description', e.target.value)}
                              placeholder={`${placementUtils.getLevelName(level)} 레벨에 대한 설명을 입력하세요`}
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setEditingConfig(null);
              }}>
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}