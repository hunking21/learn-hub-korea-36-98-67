import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { memoryRepo } from "@/repositories/memoryRepo";
import { Plus, FileText, Users, Clock } from "lucide-react";
import type { Test, TestVersion, TestSection } from "@/types";

interface AddToSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestionIds: string[];
  onAddToSection: (testId: string, versionId: string, sectionId: string, questionIds: string[]) => Promise<boolean>;
}

export function AddToSectionModal({ 
  isOpen, 
  onClose, 
  selectedQuestionIds, 
  onAddToSection 
}: AddToSectionModalProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTest = tests.find(t => t.id === selectedTestId);
  const selectedVersion = selectedTest?.versions?.find(v => v.id === selectedVersionId);
  const selectedSection = selectedVersion?.sections?.find(s => s.id === selectedSectionId);

  useEffect(() => {
    if (isOpen) {
      fetchTests();
    }
  }, [isOpen]);

  const fetchTests = async () => {
    try {
      const testsData = await memoryRepo.listTests();
      // Only show tests with versions and sections
      const testsWithContent = testsData.filter(test => 
        test.versions && test.versions.some(version => 
          version.sections && version.sections.length > 0
        )
      );
      setTests(testsWithContent);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    }
  };

  const handleTestChange = (testId: string) => {
    setSelectedTestId(testId);
    setSelectedVersionId('');
    setSelectedSectionId('');
  };

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    setSelectedSectionId('');
  };

  const handleSubmit = async () => {
    if (!selectedTestId || !selectedVersionId || !selectedSectionId) return;

    setIsSubmitting(true);
    try {
      const success = await onAddToSection(
        selectedTestId,
        selectedVersionId,
        selectedSectionId,
        selectedQuestionIds
      );
      
      if (success) {
        onClose();
        setSelectedTestId('');
        setSelectedVersionId('');
        setSelectedSectionId('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            선택 문항을 섹션에 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 선택된 문항 수 */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              선택된 문항: {selectedQuestionIds.length}개
            </Badge>
          </div>

          {/* 시험 선택 */}
          <div className="space-y-2">
            <Label>시험 선택</Label>
            <Select value={selectedTestId} onValueChange={handleTestChange}>
              <SelectTrigger>
                <SelectValue placeholder="시험을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {tests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{test.name}</span>
                      <Badge variant={test.status === 'Published' ? 'default' : 'secondary'} className="text-xs">
                        {test.status === 'Published' ? '배포됨' : '초안'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 버전 선택 */}
          {selectedTest && (
            <div className="space-y-2">
              <Label>버전 선택</Label>
              <Select value={selectedVersionId} onValueChange={handleVersionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="버전을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTest.versions?.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{version.system} - {version.grade}</span>
                        <Badge variant="outline" className="text-xs">
                          {version.sections?.length || 0}개 섹션
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 섹션 선택 */}
          {selectedVersion && (
            <div className="space-y-2">
              <Label>섹션 선택</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="섹션을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {selectedVersion.sections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{section.label || section.type}</span>
                        <Badge variant="outline" className="text-xs">
                          {section.questions?.length || 0}개 문항
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {section.timeLimit}분
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 선택 요약 */}
          {selectedSection && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">추가 대상</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• 시험: {selectedTest?.name}</div>
                <div>• 버전: {selectedVersion?.system} - {selectedVersion?.grade}</div>
                <div>• 섹션: {selectedSection.label || selectedSection.type} ({selectedSection.timeLimit}분)</div>
                <div>• 현재 문항 수: {selectedSection.questions?.length || 0}개</div>
                <div>• 추가될 문항: {selectedQuestionIds.length}개</div>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedSectionId || isSubmitting}
            >
              {isSubmitting ? '추가 중...' : `${selectedQuestionIds.length}개 문항 추가`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}