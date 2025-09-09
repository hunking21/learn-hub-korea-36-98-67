import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, X, Save, TestTube2, CheckCircle, BookOpen, RotateCcw, Clock, Edit, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { memoryRepo } from "@/repositories/memoryRepo";
import { allGradesBySystem, normalizeVersion } from "@/utils/versionHelpers";
import { SectionSelector, type SectionConfig } from "./SectionSelector";
import type { Test, System, Grade, Target, SectionType, Version, Section } from "@/types/schema";

interface QuickTestBuilderProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
  onTestUpdated: () => void;
}

interface FormState {
  name: string;
  description: string;
  selectedSystems: System[];
  selectedGrades: Record<System, Grade[]>;
  selectedSections: SectionConfig[];
}

interface ChangeSummary {
  added: { targets: Target[]; sections: SectionConfig[] };
  removed: { targets: Target[]; sections: SectionConfig[] };
  modified: { sections: { label: string; oldTime: number; newTime: number }[] };
}


const SYSTEMS: Array<{ value: System; label: string }> = [
  { value: 'KR', label: '한국 (KR)' },
  { value: 'US', label: '미국 (US)' },
  { value: 'UK', label: '영국 (UK)' }
];

export function QuickTestBuilder({ test, isOpen, onClose, onTestUpdated }: QuickTestBuilderProps) {
  const isEditMode = !!test;
  
  // Initialize form state from test data
  const initializeFormState = (): FormState => {
    if (!test?.versions?.[0]) {
      return {
        name: "",
        description: "",
        selectedSystems: ['KR'],
        selectedGrades: { KR: [], US: [], UK: [] },
        selectedSections: []
      };
    }

    const version = test.versions[0];
    const systems = version.targets?.map(t => t.system) || ['KR'];
    const grades: Record<System, Grade[]> = { KR: [], US: [], UK: [] };
    
    version.targets?.forEach(target => {
      grades[target.system] = [...target.grades];
    });

    const sections: SectionConfig[] = version.sections?.map((section, index) => ({
      id: section.id,
      label: section.label,
      type: section.type,
      timeLimit: section.timeLimit,
      enabled: true,
      isCustom: !['Reading', 'Writing', 'Interview', 'Math'].includes(section.label)
    })) || [];

    return {
      name: test.name,
      description: test.description || "",
      selectedSystems: systems,
      selectedGrades: grades,
      selectedSections: sections
    };
  };

  const [formState, setFormState] = useState<FormState>(initializeFormState());
  const [initialState, setInitialState] = useState<FormState>(initializeFormState());
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Update form state when test changes
  useEffect(() => {
    const newState = initializeFormState();
    setFormState(newState);
    setInitialState(newState);
  }, [test, isOpen]);

  // Calculate changes summary
  const changeSummary = useMemo((): ChangeSummary => {
    if (!isEditMode) return { added: { targets: [], sections: [] }, removed: { targets: [], sections: [] }, modified: { sections: [] } };

    const currentTargets = validateTargets(formState);
    const initialTargets = validateTargets(initialState);
    
    const addedTargets = currentTargets.filter(ct => 
      !initialTargets.some(it => it.system === ct.system && 
        JSON.stringify(it.grades.sort()) === JSON.stringify(ct.grades.sort())
      )
    );
    
    const removedTargets = initialTargets.filter(it => 
      !currentTargets.some(ct => ct.system === it.system && 
        JSON.stringify(ct.grades.sort()) === JSON.stringify(it.grades.sort())
      )
    );

    const enabledCurrent = formState.selectedSections.filter(s => s.enabled);
    const enabledInitial = initialState.selectedSections.filter(s => s.enabled);
    
    const addedSections = enabledCurrent.filter(cs => 
      !enabledInitial.some(is => is.label === cs.label)
    );
    
    const removedSections = enabledInitial.filter(is => 
      !enabledCurrent.some(cs => cs.label === is.label)
    );
    
    const modifiedSections = enabledCurrent.filter(cs => {
      const initial = enabledInitial.find(is => is.label === cs.label);
      return initial && initial.timeLimit !== cs.timeLimit;
    }).map(cs => {
      const initial = enabledInitial.find(is => is.label === cs.label)!;
      return { label: cs.label, oldTime: initial.timeLimit, newTime: cs.timeLimit };
    });

    return {
      added: { targets: addedTargets, sections: addedSections },
      removed: { targets: removedTargets, sections: removedSections },
      modified: { sections: modifiedSections }
    };
  }, [formState, initialState, isEditMode]);

  const hasChanges = changeSummary.added.targets.length > 0 || 
                    changeSummary.removed.targets.length > 0 ||
                    changeSummary.added.sections.length > 0 || 
                    changeSummary.removed.sections.length > 0 ||
                    changeSummary.modified.sections.length > 0 ||
                    formState.name !== initialState.name ||
                    formState.description !== initialState.description;

  const { toast } = useToast();

  const handleSystemToggle = (system: System) => {
    const newSystems = formState.selectedSystems.includes(system) 
      ? formState.selectedSystems.filter(s => s !== system)
      : [...formState.selectedSystems, system];
    
    const newGrades = formState.selectedSystems.includes(system)
      ? { ...formState.selectedGrades, [system]: [] }
      : formState.selectedGrades;

    setFormState(prev => ({
      ...prev,
      selectedSystems: newSystems,
      selectedGrades: newGrades
    }));
  };

  const handleGradeToggle = (system: System, grade: Grade) => {
    const currentGrades = formState.selectedGrades[system];
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade];

    setFormState(prev => ({
      ...prev,
      selectedGrades: {
        ...prev.selectedGrades,
        [system]: newGrades
      }
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

  const validateTargets = (state = formState): Target[] => {
    const targets: Target[] = [];
    
    for (const system of state.selectedSystems) {
      const grades = normalizeGrades(state.selectedGrades[system]);
      const uniqueGrades = Array.from(new Set(grades));
      
      if (uniqueGrades.length > 0) {
        targets.push({ system, grades: uniqueGrades });
      }
    }

    return targets;
  };

  const fillWithSample = () => {
    const sampleState: FormState = {
      name: "진단 평가 샘플",
      description: "학습자의 현재 실력을 평가하기 위한 진단 시험입니다.",
      selectedSystems: ['KR', 'US'],
      selectedGrades: {
        KR: ['초3', '초4', '초5'],
        US: ['G3', 'G4', 'G5'],
        UK: []
      },
      selectedSections: [
        { id: 'sample-1', label: 'Reading', type: 'Reading', timeLimit: 50, enabled: true },
        { id: 'sample-2', label: 'Writing', type: 'Writing', timeLimit: 15, enabled: true },
        { id: 'sample-3', label: 'Interview', type: 'Speaking', timeLimit: 15, enabled: true },
      ]
    };

    setFormState(sampleState);
    
    toast({
      title: "샘플 데이터 생성",
      description: "진단 템플릿으로 폼이 채워졌습니다.",
    });
  };

  const resetToInitial = () => {
    setFormState({ ...initialState });
    setShowResetDialog(false);
    
    toast({
      title: "초기 상태로 복원",
      description: "마지막 저장된 상태로 되돌렸습니다.",
    });
  };

  const runValidation = () => {
    const errors: string[] = [];
    
    if (!formState.name.trim()) errors.push("시험 이름이 필요합니다");
    if (formState.selectedSystems.length === 0) errors.push("최소 하나의 시스템을 선택해야 합니다");
    
    const targets = validateTargets();
    if (targets.length === 0) errors.push("최소 하나의 학년을 선택해야 합니다");
    
    const enabledSections = formState.selectedSections.filter(s => s.enabled);
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
    
    if (!formState.name.trim() || targets.length === 0) {
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
        // Update existing test basic info
        testId = test.id;
        if (formState.name !== initialState.name || formState.description !== initialState.description) {
          await memoryRepo.updateTest(testId, {
            name: formState.name.trim(),
            description: formState.description.trim() || undefined
          });
        }
      } else {
        // Create new test
        const newTest = await memoryRepo.createTest({
          name: formState.name.trim(),
          description: formState.description.trim() || undefined
        });
        if (!newTest) throw new Error("테스트 생성 실패");
        testId = newTest.id;
      }

      // Handle version and targets update with upsert logic
      let versionId: string;
      if (test?.versions?.[0]) {
        versionId = test.versions[0].id;
        
        // Only update if targets changed
        const currentTargets = validateTargets();
        const initialTargets = validateTargets(initialState);
        const targetsChanged = JSON.stringify(currentTargets.sort()) !== JSON.stringify(initialTargets.sort());
        
        if (targetsChanged) {
          await memoryRepo.addVersion(testId, { targets: currentTargets });
          const updatedTests = await memoryRepo.listTests();
          const updatedTest = updatedTests.find(t => t.id === testId);
          versionId = updatedTest?.versions?.[updatedTest.versions.length - 1]?.id || versionId;
        }
      } else {
        // Create new version
        await memoryRepo.addVersion(testId, { targets });
        const updatedTests = await memoryRepo.listTests();
        const updatedTest = updatedTests.find(t => t.id === testId);
        versionId = updatedTest?.versions?.[0]?.id || '';
      }

      // Handle sections with upsert logic
      const enabledSections = formState.selectedSections.filter(s => s.enabled);
      if (versionId) {
        // Remove sections that are no longer selected
        const removedSections = changeSummary.removed.sections;
        for (const removedSection of removedSections) {
          // Note: memoryRepo might need a removeSection method for proper cleanup
        }
        
        // Add or update sections
        for (const section of enabledSections) {
          await memoryRepo.addSection(testId, versionId, {
            label: section.label,
            type: section.type as Exclude<SectionType, 'Instruction' | 'Passage'>,
            timeLimit: section.timeLimit,
            settings: {}
          });
        }
      }

      // Update initial state to current state after successful save
      setInitialState({ ...formState });
      
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
    // Reset to initial state on close
    const resetState = initializeFormState();
    setFormState(resetState);
    setInitialState(resetState);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {test ? `시험 편집 - ${test.name}` : "새 시험 생성"}
            {isEditMode && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Edit className="h-3 w-3" />
                  수정 모드
                </Badge>
                {test?.createdAt && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {new Date(test.createdAt).toLocaleString('ko-KR')}
                  </Badge>
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            {isEditMode && hasChanges && (
              <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                되돌리기
              </Button>
            )}
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
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="시험 이름을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="test-description">시험 설명</Label>
                <Textarea
                  id="test-description"
                  value={formState.description}
                  onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
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
                      variant={formState.selectedSystems.includes(value) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90"
                      onClick={() => handleSystemToggle(value)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Grade Selection for each selected system */}
              {formState.selectedSystems.map(system => (
                <div key={system} className="space-y-2">
                  <Label>{SYSTEMS.find(s => s.value === system)?.label} 학년</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {allGradesBySystem(system).map(grade => (
                      <div key={grade} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${system}-${grade}`}
                          checked={formState.selectedGrades[system]?.includes(grade) || false}
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
            sections={formState.selectedSections}
            onSectionsChange={(sections) => setFormState(prev => ({ ...prev, selectedSections: sections }))}
          />

          {/* Changes Summary */}
          {isEditMode && hasChanges && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  변경 사항 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {changeSummary.added.targets.length > 0 && (
                  <div className="text-green-700">
                    + 추가된 대상: {changeSummary.added.targets.map(t => `${t.system}(${t.grades.join(', ')})`).join(', ')}
                  </div>
                )}
                {changeSummary.removed.targets.length > 0 && (
                  <div className="text-red-700">
                    - 제거된 대상: {changeSummary.removed.targets.map(t => `${t.system}(${t.grades.join(', ')})`).join(', ')}
                  </div>
                )}
                {changeSummary.added.sections.length > 0 && (
                  <div className="text-green-700">
                    + 추가된 섹션: {changeSummary.added.sections.map(s => `${s.label}(${s.timeLimit}분)`).join(', ')}
                  </div>
                )}
                {changeSummary.removed.sections.length > 0 && (
                  <div className="text-red-700">
                    - 제거된 섹션: {changeSummary.removed.sections.map(s => `${s.label}`).join(', ')}
                  </div>
                )}
                {changeSummary.modified.sections.length > 0 && (
                  <div className="text-blue-700">
                    ⏱ 시간 변경: {changeSummary.modified.sections.map(s => `${s.label}(${s.oldTime}분→${s.newTime}분)`).join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || (isEditMode && !hasChanges)}
            className={hasChanges ? "bg-primary" : ""}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? '저장 중...' : isEditMode && hasChanges ? '변경사항 저장' : '저장'}
          </Button>
        </div>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>초기 상태로 되돌리기</AlertDialogTitle>
              <AlertDialogDescription>
                현재 변경사항을 모두 취소하고 마지막 저장된 상태로 되돌립니다. 
                이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={resetToInitial}>
                되돌리기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}