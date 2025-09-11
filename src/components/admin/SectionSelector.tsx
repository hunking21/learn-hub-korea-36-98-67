import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Upload, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSectionPresetsStore, type SectionPreset } from "@/store/sectionPresetsStore";
import type { SectionType } from "@/types/schema";

export interface SectionConfig {
  id: string;
  label: string;
  type: SectionType;
  timeLimit: number;
  enabled: boolean;
  isCustom?: boolean;
}

interface SectionSelectorProps {
  sections: SectionConfig[];
  onSectionsChange: (sections: SectionConfig[]) => void;
}

const DEFAULT_SECTIONS: Omit<SectionConfig, 'id' | 'enabled'>[] = [
  { label: "Reading", type: "Reading", timeLimit: 50, isCustom: false },
  { label: "Writing", type: "Writing", timeLimit: 15, isCustom: false },
  { label: "Interview", type: "Speaking", timeLimit: 15, isCustom: false },
  { label: "Math", type: "Custom", timeLimit: 50, isCustom: false },
];

export function SectionSelector({ sections, onSectionsChange }: SectionSelectorProps) {
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newSectionTime, setNewSectionTime] = useState("30");
  const [presetName, setPresetName] = useState("");
  const [previewPreset, setPreviewPreset] = useState<SectionPreset | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const { toast } = useToast();
  
  const {
    presets,
    addPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
    defaultPresetId,
    autoApplyDefault,
    setAutoApplyDefault,
    getDefaultPreset,
  } = useSectionPresetsStore();

  // Initialize with default sections if empty
  const currentSections = sections.length === 0 
    ? DEFAULT_SECTIONS.map((section, index) => ({
        ...section,
        id: `default-${index}`,
        enabled: false,
      }))
    : sections;

  const validateDuplicateLabels = (label: string, excludeId?: string): boolean => {
    return currentSections.some(section => 
      section.label === label && section.id !== excludeId
    );
  };

  const handleSectionToggle = (sectionId: string) => {
    const updatedSections = currentSections.map(section =>
      section.id === sectionId 
        ? { ...section, enabled: !section.enabled }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const handleTimeChange = (sectionId: string, timeValue: string) => {
    const time = parseInt(timeValue) || 1;
    if (time < 1) {
      toast({
        title: "시간 오류",
        description: "시간은 1분 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    const updatedSections = currentSections.map(section =>
      section.id === sectionId 
        ? { ...section, timeLimit: time }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const handleAddCustomSection = () => {
    const label = newSectionLabel.trim();
    const time = parseInt(newSectionTime) || 1;

    if (!label) {
      toast({
        title: "입력 오류",
        description: "섹션 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (validateDuplicateLabels(label)) {
      toast({
        title: "중복 오류",
        description: "이미 존재하는 섹션 이름입니다.",
        variant: "destructive",
      });
      return;
    }

    if (time < 1) {
      toast({
        title: "시간 오류",
        description: "시간은 1분 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    const newSection: SectionConfig = {
      id: `custom-${Date.now()}`,
      label,
      type: "Custom",
      timeLimit: time,
      enabled: true,
      isCustom: true,
    };

    onSectionsChange([...currentSections, newSection]);
    setNewSectionLabel("");
    setNewSectionTime("30");
    
    toast({
      title: "섹션 추가",
      description: `${label} 섹션이 추가되었습니다.`,
    });
  };

  const handleRemoveCustomSection = (sectionId: string) => {
    const updatedSections = currentSections.filter(section => section.id !== sectionId);
    onSectionsChange(updatedSections);
    
    toast({
      title: "섹션 삭제",
      description: "커스텀 섹션이 삭제되었습니다.",
    });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "입력 오류",
        description: "프리셋 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const enabledSections = currentSections.filter(section => section.enabled);
    if (enabledSections.length === 0) {
      toast({
        title: "섹션 오류",
        description: "최소 하나의 섹션을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const presetSections = enabledSections.map(section => ({
      label: section.label,
      type: section.type,
      timeLimit: section.timeLimit,
    }));

    addPreset({
      name: presetName,
      sections: presetSections,
    });

    setPresetName("");
    setShowSaveDialog(false);
    
    toast({
      title: "프리셋 저장",
      description: `${presetName} 프리셋이 저장되었습니다.`,
    });
  };

  const handleLoadPreset = (preset: SectionPreset, replaceMode: boolean = false) => {
    const newSections = preset.sections.map((presetSection, index) => ({
      id: `preset-${Date.now()}-${index}`,
      label: presetSection.label,
      type: presetSection.type,
      timeLimit: presetSection.timeLimit,
      enabled: true,
      isCustom: !DEFAULT_SECTIONS.some(def => def.label === presetSection.label),
    }));

    if (replaceMode) {
      onSectionsChange(newSections);
    } else {
      // Merge mode: keep existing enabled sections, add preset sections
      const existingLabels = currentSections
        .filter(section => section.enabled)
        .map(section => section.label);
      
      const mergedSections = [
        ...currentSections,
        ...newSections.filter(section => !existingLabels.includes(section.label)),
      ];
      
      onSectionsChange(mergedSections);
    }

    setShowLoadDialog(false);
    setPreviewPreset(null);
    
    toast({
      title: "프리셋 적용",
      description: `${preset.name} 프리셋이 ${replaceMode ? '교체' : '병합'}되었습니다.`,
    });
  };

  const handleDeletePreset = (presetId: string) => {
    deletePreset(presetId);
    toast({
      title: "프리셋 삭제",
      description: "프리셋이 삭제되었습니다.",
    });
  };

  const handleSetDefaultPreset = (presetId: string) => {
    setDefaultPreset(presetId);
    toast({
      title: "기본 프리셋 설정",
      description: "기본 프리셋이 설정되었습니다.",
    });
  };

  const enabledSections = currentSections.filter(section => section.enabled);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>섹션 선택 (멀티)</CardTitle>
          <div className="flex items-center gap-2">
            {/* Auto-apply default toggle */}
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="auto-apply-default"
                checked={autoApplyDefault}
                onCheckedChange={setAutoApplyDefault}
              />
              <Label htmlFor="auto-apply-default" className="cursor-pointer">
                기본 프리셋 자동 적용
              </Label>
            </div>
            
            {/* Preset controls */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  저장
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>프리셋 저장</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="preset-name">프리셋 이름</Label>
                    <Input
                      id="preset-name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="프리셋 이름을 입력하세요"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    현재 선택된 {enabledSections.length}개 섹션이 저장됩니다:
                    <div className="mt-1">
                      {enabledSections.map(section => 
                        `${section.label} (${section.timeLimit}분)`
                      ).join(", ")}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleSavePreset}>저장</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  불러오기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>프리셋 불러오기</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {presets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      저장된 프리셋이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {presets.map((preset) => (
                        <div key={preset.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{preset.name}</span>
                              {preset.id === defaultPresetId && (
                                <Badge variant="secondary" className="text-xs">기본</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefaultPreset(preset.id)}
                                disabled={preset.id === defaultPresetId}
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>프리셋 삭제</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{preset.name}" 프리셋을 삭제하시겠습니까?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePreset(preset.id)}>
                                      삭제
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            {preset.sections.map(section => 
                              `${section.label} (${section.timeLimit}분)`
                            ).join(", ")}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadPreset(preset, false)}
                            >
                              병합
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadPreset(preset, true)}
                            >
                              교체
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
                      닫기
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default and custom sections */}
        <div className="space-y-3">
          {currentSections.map((section) => (
            <div key={section.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <Checkbox
                id={section.id}
                checked={section.enabled}
                onCheckedChange={() => handleSectionToggle(section.id)}
              />
              <Label 
                htmlFor={section.id}
                className="flex-1 cursor-pointer font-medium"
              >
                {section.label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={section.timeLimit}
                  onChange={(e) => handleTimeChange(section.id, e.target.value)}
                  className="w-20 text-center"
                  disabled={!section.enabled}
                />
                <span className="text-sm text-muted-foreground">분</span>
              </div>
              {section.isCustom && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCustomSection(section.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom section */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-3 block">직접 추가</Label>
          <div className="flex gap-2">
            <Input
              placeholder="섹션 이름"
              value={newSectionLabel}
              onChange={(e) => setNewSectionLabel(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="1"
                placeholder="시간"
                value={newSectionTime}
                onChange={(e) => setNewSectionTime(e.target.value)}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">분</span>
            </div>
            <Button onClick={handleAddCustomSection} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        {enabledSections.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">선택된 섹션 ({enabledSections.length}개):</p>
            <div className="text-sm text-muted-foreground">
              {enabledSections.map(section => 
                `${section.label} (${section.timeLimit}분)`
              ).join(", ")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}