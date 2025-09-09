import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Save, TestTube2, CheckCircle, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { memoryRepo } from "@/repositories/memoryRepo";
import { allGradesBySystem, normalizeVersion } from "@/utils/versionHelpers";
import type { Test, System, Grade, Target, SectionType } from "@/types/schema";

interface QuickTestBuilderProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
  onTestUpdated: () => void;
}

type SectionPreset = SectionType | 'None';

const SECTION_PRESETS: Array<{ value: SectionPreset; label: string; settings?: Record<string, unknown> }> = [
  { value: 'Listening', label: 'Listening', settings: { audioUrl: '', autoPlay: false } },
  { value: 'Reading', label: 'Reading', settings: { passageId: '' } },
  { value: 'Speaking', label: 'Speaking', settings: { recordingEnabled: true, maxRecordingTime: 120 } },
  { value: 'Writing', label: 'Writing', settings: { maxWords: 300, useRubric: true } },
  { value: 'None', label: '없음 (빈 버전)' }
] as const;

const SYSTEMS: Array<{ value: System; label: string }> = [
  { value: 'KR', label: '한국 (KR)' },
  { value: 'US', label: '미국 (US)' },
  { value: 'UK', label: '영국 (UK)' }
];

export function QuickTestBuilder({ test, isOpen, onClose, onTestUpdated }: QuickTestBuilderProps) {
  const [name, setName] = useState(test?.name || "");
  const [description, setDescription] = useState(test?.description || "");
  const [selectedSystems, setSelectedSystems] = useState<System[]>(['KR']);
  const [selectedGrades, setSelectedGrades] = useState<Record<System, Grade[]>>({
    KR: [],
    US: [],
    UK: []
  });
  const [selectedPresets, setSelectedPresets] = useState<SectionPreset[]>(['Listening']);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const handleSystemToggle = (system: System) => {
    if (selectedSystems.includes(system)) {
      setSelectedSystems(prev => prev.filter(s => s !== system));
      setSelectedGrades(prev => ({ ...prev, [system]: [] }));
    } else {
      setSelectedSystems(prev => [...prev, system]);
    }
  };

  const handleGradeToggle = (system: System, grade: Grade) => {
    setSelectedGrades(prev => ({
      ...prev,
      [system]: prev[system].includes(grade)
        ? prev[system].filter(g => g !== grade)
        : [...prev[system], grade]
    }));
  };

  const handlePresetToggle = (preset: SectionPreset) => {
    if (selectedPresets.includes(preset)) {
      setSelectedPresets(prev => prev.filter(p => p !== preset));
    } else {
      if (preset === 'None') {
        setSelectedPresets(['None']);
      } else {
        setSelectedPresets(prev => prev.filter(p => p !== 'None').concat([preset]));
      }
    }
  };

  const normalizeGrades = (grades: Grade[]): Grade[] => {
    return grades.map(grade => {
      // Auto-normalize grade formats
      if (grade.match(/^G0?(\d+)$/)) {
        return grade.replace(/^G0?/, 'G');
      }
      if (grade.match(/^Yr0?(\d+)$/)) {
        return grade.replace(/^Yr0?/, 'Yr');
      }
      return grade;
    });
  };

  const validateTargets = (): Target[] => {
    const targets: Target[] = [];
    
    for (const system of selectedSystems) {
      const grades = normalizeGrades(selectedGrades[system]);
      // Remove duplicates
      const uniqueGrades = Array.from(new Set(grades));
      
      if (uniqueGrades.length > 0) {
        targets.push({ system, grades: uniqueGrades });
      }
    }

    return targets;
  };

  const fillWithSample = () => {
    setName("진단 평가 샘플");
    setDescription("학습자의 현재 실력을 평가하기 위한 진단 시험입니다.");
    setSelectedSystems(['KR', 'US']);
    setSelectedGrades({
      KR: ['초3', '초4', '초5'],
      US: ['G3', 'G4', 'G5'],
      UK: []
    });
    setSelectedPresets(['Listening', 'Reading', 'Speaking']);
    
    toast({
      title: "샘플 데이터 생성",
      description: "진단 템플릿으로 폼이 채워졌습니다.",
    });
  };

  const runValidation = () => {
    const errors: string[] = [];
    
    if (!name.trim()) errors.push("시험 이름이 필요합니다");
    if (selectedSystems.length === 0) errors.push("최소 하나의 시스템을 선택해야 합니다");
    
    const targets = validateTargets();
    if (targets.length === 0) errors.push("최소 하나의 학년을 선택해야 합니다");
    
    if (selectedPresets.length === 0) {
      errors.push("최소 하나의 섹션 프리셋을 선택하거나 '없음'을 선택해야 합니다");
    }

    if (errors.length === 0) {
      toast({
        title: "✓ 검증 통과",
        description: `타깃 ${targets.length}개, 섹션 ${selectedPresets.length}개가 유효합니다.`,
      });
    } else {
      toast({
        title: "검증 실패",
        description: errors.join(", "),
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    const targets = validateTargets();
    
    if (!name.trim() || targets.length === 0) {
      toast({
        title: "입력 오류",
        description: "시험 이름과 최소 하나의 대상을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let testId: string;
      
      if (test) {
        // Update existing test
        testId = test.id;
        await memoryRepo.updateTest(testId, {
          name: name.trim(),
          description: description.trim() || undefined
        });
      } else {
        // Create new test
        const newTest = await memoryRepo.createTest({
          name: name.trim(),
          description: description.trim() || undefined
        });
        if (!newTest) throw new Error("테스트 생성 실패");
        testId = newTest.id;
      }

      // Always create a new version or get existing one
      let versionId: string;
      if (test?.versions?.[0]) {
        versionId = test.versions[0].id;
        // For existing tests, just update by recreating version
        await memoryRepo.addVersion(testId, { targets });
        // Get the latest version after adding
        const updatedTests = await memoryRepo.listTests();
        const updatedTest = updatedTests.find(t => t.id === testId);
        versionId = updatedTest?.versions?.[updatedTest.versions.length - 1]?.id || versionId;
      } else {
        // Create new version
        await memoryRepo.addVersion(testId, { targets });
        // Get the created version
        const updatedTests = await memoryRepo.listTests();
        const updatedTest = updatedTests.find(t => t.id === testId);
        versionId = updatedTest?.versions?.[0]?.id || '';
      }

      // Add selected sections if not "None"
      if (!selectedPresets.includes('None') && versionId) {
        for (const preset of selectedPresets) {
          if (preset !== 'None') {
            const presetData = SECTION_PRESETS.find(p => p.value === preset);
            if (presetData && presetData.value !== 'None') {
                await memoryRepo.addSection(testId, versionId, {
                  label: presetData.label,
                  type: presetData.value as Exclude<SectionType, 'Instruction' | 'Passage'>,
                  timeLimit: 30, // Default time limit
                  settings: presetData.settings
                });
            }
          }
        }
      }

      onTestUpdated();
      onClose();
      
      toast({
        title: "저장 완료",
        description: `시험이 성공적으로 ${test ? '수정' : '생성'}되었습니다.`,
      });
      
    } catch (error) {
      console.error('시험 저장 실패:', error);
      toast({
        title: "오류",
        description: "시험 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedSystems(['KR']);
    setSelectedGrades({ KR: [], US: [], UK: [] });
    setSelectedPresets(['Listening']);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {test ? `시험 편집 - ${test.name}` : "새 시험 생성"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Validation buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={fillWithSample}>
              <TestTube2 className="h-4 w-4 mr-2" />
              샘플로 채우기
            </Button>
            <Button variant="outline" size="sm" onClick={runValidation}>
              <CheckCircle className="h-4 w-4 mr-2" />
              검증 실행
            </Button>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-name">시험 이름 *</Label>
                <Input
                  id="test-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="시험 이름을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="test-description">시험 설명</Label>
                <Textarea
                  id="test-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="시험에 대한 설명을 입력하세요 (선택사항)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Selection */}
          <Card>
            <CardHeader>
              <CardTitle>대상 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Selection */}
              <div>
                <Label>시스템 (다중 선택 가능)</Label>
                <div className="flex gap-2 mt-2">
                  {SYSTEMS.map(({ value, label }) => (
                    <Badge
                      key={value}
                      variant={selectedSystems.includes(value) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90"
                      onClick={() => handleSystemToggle(value)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Grade Selection for each selected system */}
              {selectedSystems.map(system => (
                <div key={system} className="space-y-2">
                  <Label>{SYSTEMS.find(s => s.value === system)?.label} 학년</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {allGradesBySystem(system).map(grade => (
                      <div key={grade} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${system}-${grade}`}
                          checked={selectedGrades[system]?.includes(grade) || false}
                          onCheckedChange={() => handleGradeToggle(system, grade)}
                        />
                        <Label 
                          htmlFor={`${system}-${grade}`}
                          className="text-sm cursor-pointer"
                        >
                          {grade}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section Presets */}
          <Card>
            <CardHeader>
              <CardTitle>섹션 프리셋 (선택사항)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {SECTION_PRESETS.map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant={selectedPresets.includes(value) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90 justify-center py-2"
                    onClick={() => handlePresetToggle(value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                선택한 섹션들이 자동으로 추가됩니다. '없음'을 선택하면 빈 버전이 생성됩니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}