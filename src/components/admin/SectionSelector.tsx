import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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

  const enabledSections = currentSections.filter(section => section.enabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle>섹션 선택 (멀티)</CardTitle>
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