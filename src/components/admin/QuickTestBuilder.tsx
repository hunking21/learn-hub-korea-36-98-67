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
import { SectionSelector, type SectionConfig } from "./SectionSelector";
import type { Test, System, Grade, Target, SectionType } from "@/types/schema";

interface QuickTestBuilderProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
  onTestUpdated: () => void;
}


const SYSTEMS: Array<{ value: System; label: string }> = [
  { value: 'KR', label: '한국 (KR)' },
  { value: 'US', label: '미국 (US)' },
  { value: 'UK', label: '영국 (UK)' }
];

export function QuickTestBuilder({ test, isOpen, onClose, onTestUpdated }: QuickTestBuilderProps) {
  // Initialize systems and grades from existing test
  const initializeTargets = () => {
    if (test?.versions?.[0]?.targets) {
      const systems = test.versions[0].targets.map(t => t.system);
      const grades: Record<System, Grade[]> = { KR: [], US: [], UK: [] };
      test.versions[0].targets.forEach(target => {
        grades[target.system] = target.grades;
      });
      return { systems, grades };
    }
    return { systems: ['KR'] as System[], grades: { KR: [], US: [], UK: [] } as Record<System, Grade[]> };
  };

  const { systems: initialSystems, grades: initialGrades } = initializeTargets();
  
  const [name, setName] = useState(test?.name || "");
  const [description, setDescription] = useState(test?.description || "");
  const [selectedSystems, setSelectedSystems] = useState<System[]>(initialSystems);
  const [selectedGrades, setSelectedGrades] = useState<Record<System, Grade[]>>(initialGrades);
  
  // Initialize sections from existing test or empty
  const initializeSections = (): SectionConfig[] => {
    if (test?.versions?.[0]?.sections) {
      return test.versions[0].sections.map((section, index) => ({
        id: section.id || `existing-${index}`,
        label: section.label,
        type: section.type,
        timeLimit: section.timeLimit,
        enabled: true,
        isCustom: !['Reading', 'Writing', 'Interview', 'Math'].includes(section.label)
      }));
    }
    return [];
  };
  
  const [selectedSections, setSelectedSections] = useState<SectionConfig[]>(initializeSections());
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
    setSelectedSections([
      { id: 'sample-1', label: 'Reading', type: 'Reading', timeLimit: 50, enabled: true },
      { id: 'sample-2', label: 'Writing', type: 'Writing', timeLimit: 15, enabled: true },
      { id: 'sample-3', label: 'Interview', type: 'Speaking', timeLimit: 15, enabled: true },
    ]);
    
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
    
    const enabledSections = selectedSections.filter(s => s.enabled);
    if (enabledSections.length === 0) {
      errors.push("최소 하나의 섹션을 선택해야 합니다");
    }

    if (errors.length === 0) {
      toast({
        title: "✓ 검증 통과",
        description: `타깃 ${targets.length}개, 섹션 ${enabledSections.length}개가 유효합니다.`,
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

      // Add enabled sections
      const enabledSections = selectedSections.filter(s => s.enabled);
      if (enabledSections.length > 0 && versionId) {
        for (const section of enabledSections) {
          await memoryRepo.addSection(testId, versionId, {
            label: section.label,
            type: section.type as Exclude<SectionType, 'Instruction' | 'Passage'>,
            timeLimit: section.timeLimit,
            settings: {}
          });
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
    setSelectedSections([]);
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

          {/* Section Selector */}
          <SectionSelector
            sections={selectedSections}
            onSectionsChange={setSelectedSections}
          />
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