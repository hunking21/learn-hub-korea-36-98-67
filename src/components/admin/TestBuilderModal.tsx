import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, Save, X, BookOpen, Clock, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { memoryRepo } from "@/repositories/memoryRepo";
import type { Test, TestVersion, TestSection, Question } from "@/types";
import { SpeakingQuestionGeneratorModal } from "./SpeakingQuestionGeneratorModal";

interface TestBuilderModalProps {
  test: Test | null;
  isOpen: boolean;
  onClose: () => void;
  onTestUpdated: () => void;
}

interface NewVersionTarget {
  system: 'KR' | 'US' | 'UK';
  grades: string[];
}

interface NewSectionData {
  label: string;
  type: 'Listening' | 'Reading' | 'Speaking' | 'Writing' | 'Custom';
  timeLimit: number;
  settings?: any;
}

interface NewQuestionData {
  type: 'MCQ' | 'Short' | 'Speaking' | 'Writing' | 'Instruction' | 'Passage';
  prompt: string;
  choices?: string[];
  answer: number | string;
  points: number;
  writingSettings?: any;
  isInstructionOnly?: boolean;
  passageContent?: string;
  passageId?: string;
}

const GRADE_OPTIONS = {
  KR: ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'],
  US: Array.from({ length: 13 }, (_, i) => i === 0 ? 'GK' : `G${i}`),
  UK: Array.from({ length: 13 }, (_, i) => `Yr${i + 1}`)
};

const SECTION_PRESETS = [
  { type: 'Listening', label: 'Listening', settings: { audioUrl: '', autoPlay: false } },
  { type: 'Reading', label: 'Reading', settings: { passageId: '' } },
  { type: 'Speaking', label: 'Speaking', settings: { recordingEnabled: true, maxRecordingTime: 120 } },
  { type: 'Writing', label: 'Writing', settings: { maxWords: 300, useRubric: true } },
  { type: 'Custom', label: 'Custom', settings: {} }
];

export function TestBuilderModal({ test, isOpen, onClose, onTestUpdated }: TestBuilderModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [testData, setTestData] = useState<Test | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<TestVersion | null>(null);
  const [selectedSection, setSelectedSection] = useState<TestSection | null>(null);
  
  // Form states
  const [basicInfo, setBasicInfo] = useState({ name: "", description: "" });
  const [newVersion, setNewVersion] = useState<{ targets: NewVersionTarget[] }>({ targets: [{ system: 'KR', grades: [] }] });
  const [newSection, setNewSection] = useState<NewSectionData>({ 
    label: '', 
    type: 'Listening', 
    timeLimit: 30,
    settings: {}
  });
  const [newQuestion, setNewQuestion] = useState<NewQuestionData>({ 
    type: 'MCQ', 
    prompt: '', 
    choices: ['', '', '', ''], 
    answer: 0, 
    points: 1 
  });
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [showSpeakingGenerator, setShowSpeakingGenerator] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('Listening');
  
  const { toast } = useToast();

  useEffect(() => {
    if (test && isOpen) {
      setTestData(test);
      setBasicInfo({ name: test.name, description: test.description || "" });
      
      // Auto-select first version if available
      if (test.versions && test.versions.length > 0) {
        setSelectedVersion(test.versions[0]);
      }
    }
  }, [test, isOpen]);

  const handleSaveBasicInfo = async () => {
    if (!testData || !basicInfo.name.trim()) return;

    try {
      const success = await memoryRepo.updateTest(testData.id, {
        name: basicInfo.name,
        description: basicInfo.description || undefined
      });

      if (success) {
        setTestData(prev => prev ? { ...prev, name: basicInfo.name, description: basicInfo.description } : null);
        onTestUpdated();
        toast({
          title: "저장 완료",
          description: "기본 정보가 업데이트되었습니다.",
        });
      }
    } catch (error) {
      console.error('기본 정보 저장 실패:', error);
      toast({
        title: "오류",
        description: "기본 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAddVersion = async () => {
    if (!testData || newVersion.targets.length === 0) return;

    // Validate that all targets have at least one grade selected
    const validTargets = newVersion.targets.filter(target => target.grades.length > 0);
    if (validTargets.length === 0) {
      toast({
        title: "오류",
        description: "최소 하나의 학년을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await memoryRepo.addVersion(testData.id, {
        targets: validTargets
      });

      if (success) {
        await refreshTestData();
        setNewVersion({ targets: [{ system: 'KR', grades: [] }] });
        toast({
          title: "버전 추가 완료",
          description: "새 버전이 추가되었습니다.",
        });
      }
    } catch (error) {
      console.error('버전 추가 실패:', error);
      toast({
        title: "오류",
        description: "버전 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVersion = async (version: TestVersion) => {
    if (!testData) return;

    toast({
      title: "기능 구현 중",
      description: "버전 삭제 기능은 곧 추가될 예정입니다.",
      variant: "destructive",
    });
  };

  const handleAddSection = async () => {
    if (!testData || !selectedVersion || !newSection.label.trim()) return;

    try {
      const success = await memoryRepo.addSection(testData.id, selectedVersion.id, {
        label: newSection.label,
        type: newSection.type,
        timeLimit: newSection.timeLimit,
        settings: newSection.settings
      });

      if (success) {
        await refreshTestData();
        setNewSection({ label: '', type: 'Listening', timeLimit: 30, settings: {} });
        setSelectedPreset('Listening');
        toast({
          title: "섹션 추가 완료",
          description: `${newSection.label} 섹션이 추가되었습니다.`,
        });
      }
    } catch (error) {
      console.error('섹션 추가 실패:', error);
      toast({
        title: "오류",
        description: "섹션 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSection = async (section: TestSection) => {
    if (!testData || !selectedVersion) return;

    try {
      const success = await memoryRepo.deleteSection(testData.id, selectedVersion.id, section.id);
      if (success) {
        await refreshTestData();
        toast({
          title: "섹션 삭제 완료",
          description: "섹션이 삭제되었습니다.",
        });
      }
    } catch (error) {
      console.error('섹션 삭제 실패:', error);
      toast({
        title: "오류",
        description: "섹션 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAddQuestion = (section: TestSection) => {
    setSelectedSection(section);
    setEditingQuestion(null);
    setNewQuestion({ type: 'MCQ', prompt: '', choices: ['', '', '', ''], answer: 0, points: 1 });
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (section: TestSection, question: Question) => {
    setSelectedSection(section);
    setEditingQuestion(question);
    setNewQuestion({
      type: question.type,
      prompt: question.prompt,
      choices: question.choices || ['', '', '', ''],
      answer: Array.isArray(question.answer) ? question.answer[0] : question.answer || 0,
      points: question.points,
      writingSettings: question.writingSettings,
      isInstructionOnly: question.isInstructionOnly,
      passageContent: question.passageContent,
      passageId: question.passageId
    });
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!testData || !selectedVersion || !selectedSection) return;

    try {
      let success = false;
      if (editingQuestion) {
        success = await memoryRepo.updateQuestion(
          testData.id, 
          selectedVersion.id, 
          selectedSection.id, 
          editingQuestion.id,
          newQuestion
        );
      } else {
        success = await memoryRepo.addQuestion(testData.id, selectedVersion.id, selectedSection.id, newQuestion);
      }

      if (success) {
        await refreshTestData();
        setIsQuestionDialogOpen(false);
        toast({
          title: editingQuestion ? "문제 수정 완료" : "문제 추가 완료",
          description: "문제가 저장되었습니다.",
        });
      }
    } catch (error) {
      console.error('문제 저장 실패:', error);
      toast({
        title: "오류",
        description: "문제 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (section: TestSection, question: Question) => {
    if (!testData || !selectedVersion) return;

    try {
      const success = await memoryRepo.deleteQuestion(testData.id, selectedVersion.id, section.id, question.id);
      if (success) {
        await refreshTestData();
        toast({
          title: "문제 삭제 완료",
          description: "문제가 삭제되었습니다.",
        });
      }
    } catch (error) {
      console.error('문제 삭제 실패:', error);
      toast({
        title: "오류",
        description: "문제 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const refreshTestData = async () => {
    if (!testData) return;
    
    onTestUpdated();
    const updatedTests = await memoryRepo.listTests();
    const updatedTest = updatedTests.find(t => t.id === testData.id);
    if (updatedTest) {
      setTestData(updatedTest);
      if (selectedVersion) {
        const updatedVersion = updatedTest.versions?.find(v => v.id === selectedVersion.id);
        if (updatedVersion) {
          setSelectedVersion(updatedVersion);
        }
      }
    }
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetData = SECTION_PRESETS.find(p => p.type === preset);
    if (presetData) {
      setNewSection(prev => ({
        ...prev,
        type: presetData.type as any,
        label: presetData.label,
        settings: presetData.settings
      }));
    }
  };

  const renderVersionTargets = (version: TestVersion) => {
    return version.targets?.map((target, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10">
          {target.system}
        </Badge>
        <div className="flex flex-wrap gap-1">
          {target.grades.map(grade => (
            <Badge key={grade} variant="secondary" className="text-xs">
              {grade}
            </Badge>
          ))}
        </div>
      </div>
    )) || [];
  };

  const addNewTarget = () => {
    setNewVersion(prev => ({
      targets: [...prev.targets, { system: 'KR', grades: [] }]
    }));
  };

  const updateTarget = (index: number, updates: Partial<NewVersionTarget>) => {
    setNewVersion(prev => ({
      targets: prev.targets.map((target, i) => 
        i === index ? { ...target, ...updates } : target
      )
    }));
  };

  const removeTarget = (index: number) => {
    setNewVersion(prev => ({
      targets: prev.targets.filter((_, i) => i !== index)
    }));
  };

  const toggleGrade = (targetIndex: number, grade: string) => {
    setNewVersion(prev => ({
      targets: prev.targets.map((target, i) => {
        if (i === targetIndex) {
          const grades = target.grades.includes(grade)
            ? target.grades.filter(g => g !== grade)
            : [...target.grades, grade];
          return { ...target, grades };
        }
        return target;
      })
    }));
  };

  if (!testData) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              시험 빌더 - {testData.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">① 기본정보</TabsTrigger>
              <TabsTrigger value="versions">② 버전</TabsTrigger>
              <TabsTrigger value="sections">③ 섹션</TabsTrigger>
              <TabsTrigger value="questions">④ 문항</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      기본 정보 편집
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="test-name">시험 이름</Label>
                      <Input
                        id="test-name"
                        value={basicInfo.name}
                        onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="시험 이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="test-description">설명</Label>
                      <Textarea
                        id="test-description"
                        value={basicInfo.description}
                        onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="시험에 대한 설명을 입력하세요"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleSaveBasicInfo} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      기본 정보 저장
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      새 버전 추가
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {newVersion.targets.map((target, targetIndex) => (
                      <div key={targetIndex} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>타겟 {targetIndex + 1}</Label>
                          {newVersion.targets.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeTarget(targetIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div>
                          <Label>학제</Label>
                          <Select 
                            value={target.system} 
                            onValueChange={(value: 'KR' | 'US' | 'UK') => 
                              updateTarget(targetIndex, { system: value, grades: [] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KR">한국 (KR)</SelectItem>
                              <SelectItem value="US">미국 (US)</SelectItem>
                              <SelectItem value="UK">영국 (UK)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>학년 (다중 선택)</Label>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {GRADE_OPTIONS[target.system].map(grade => (
                              <div key={grade} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`grade-${targetIndex}-${grade}`}
                                  checked={target.grades.includes(grade)}
                                  onCheckedChange={() => toggleGrade(targetIndex, grade)}
                                />
                                <Label 
                                  htmlFor={`grade-${targetIndex}-${grade}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {grade}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button onClick={addNewTarget} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        타겟 추가
                      </Button>
                      <Button onClick={handleAddVersion} className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        버전 추가
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>기존 버전 목록</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testData.versions?.map(version => (
                        <div key={version.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary">버전</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(version.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {renderVersionTargets(version)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVersion(version)}
                              disabled={selectedVersion?.id === version.id}
                            >
                              {selectedVersion?.id === version.id ? '선택됨' : '선택'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVersion(version)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sections" className="space-y-4">
                {!selectedVersion ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">버전 탭에서 먼저 버전을 선택해주세요.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          새 섹션 추가
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>프리셋 선택</Label>
                            <Select value={selectedPreset} onValueChange={handlePresetChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SECTION_PRESETS.map(preset => (
                                  <SelectItem key={preset.type} value={preset.type}>
                                    {preset.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>섹션 라벨 (직접 입력)</Label>
                            <Input
                              value={newSection.label}
                              onChange={(e) => setNewSection(prev => ({ ...prev, label: e.target.value }))}
                              placeholder="섹션 이름을 입력하세요"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>제한 시간 (분)</Label>
                          <Input
                            type="number"
                            value={newSection.timeLimit}
                            onChange={(e) => setNewSection(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                            min="1"
                          />
                        </div>

                        {/* 프리셋별 추가 설정 */}
                        {newSection.type === 'Listening' && (
                          <div className="space-y-2">
                            <Label>리스닝 설정</Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={newSection.settings?.autoPlay}
                                onCheckedChange={(checked) => 
                                  setNewSection(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, autoPlay: checked }
                                  }))
                                }
                              />
                              <Label>자동 재생</Label>
                            </div>
                          </div>
                        )}

                        {newSection.type === 'Writing' && (
                          <div className="space-y-2">
                            <Label>라이팅 설정</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>최대 단어 수</Label>
                                <Input
                                  type="number"
                                  value={newSection.settings?.maxWords || 300}
                                  onChange={(e) => setNewSection(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, maxWords: parseInt(e.target.value) || 300 }
                                  }))}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={newSection.settings?.useRubric}
                                  onCheckedChange={(checked) => setNewSection(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, useRubric: checked }
                                  }))}
                                />
                                <Label>루브릭 사용</Label>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button onClick={handleAddSection} disabled={!newSection.label.trim()} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          섹션 추가
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>기존 섹션 목록</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedVersion.sections?.map((section, index) => (
                            <div key={section.id} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded text-primary">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium">{section.label}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {section.type} • {section.timeLimit}분 • {section.questions?.length || 0}문항
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveTab("questions")}
                                >
                                  문항 관리
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSection(section)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="questions" className="space-y-4">
                {!selectedVersion ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">버전을 먼저 선택해주세요.</p>
                    </CardContent>
                  </Card>
                ) : selectedVersion.sections?.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">섹션을 먼저 생성해주세요.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {selectedVersion.sections?.map(section => (
                      <Card key={section.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{section.label}</CardTitle>
                            <Button
                              onClick={() => handleAddQuestion(section)}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              문항 추가
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {section.questions?.map((question, qIndex) => (
                              <div key={question.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline">{question.type}</Badge>
                                      <Badge variant="secondary">{question.points}점</Badge>
                                      <span className="text-sm text-muted-foreground">문제 {qIndex + 1}</span>
                                    </div>
                                    <p className="text-sm mb-2">{question.prompt}</p>
                                    {question.choices && (
                                      <div className="text-xs text-muted-foreground">
                                        선택지: {question.choices.filter(c => c.trim()).length}개
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditQuestion(section, question)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteQuestion(section, question)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )) || (
                              <div className="text-center py-4 text-muted-foreground">
                                이 섹션에 문항이 없습니다. 문항을 추가해보세요.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "문항 수정" : "문항 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>문항 유형</Label>
                <Select 
                  value={newQuestion.type} 
                  onValueChange={(value: any) => setNewQuestion(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">객관식 (MCQ)</SelectItem>
                    <SelectItem value="Short">단답형 (Short)</SelectItem>
                    <SelectItem value="Speaking">말하기 (Speaking)</SelectItem>
                    <SelectItem value="Writing">서술형 (Writing)</SelectItem>
                    <SelectItem value="Instruction">안내문 (Instruction)</SelectItem>
                    <SelectItem value="Passage">지문 (Passage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>배점</Label>
                <Input
                  type="number"
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label>문항 내용</Label>
              <Textarea
                value={newQuestion.prompt}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="문항 내용을 입력하세요"
                rows={3}
              />
            </div>

            {newQuestion.type === 'MCQ' && (
              <div>
                <Label>선택지</Label>
                {newQuestion.choices?.map((choice, index) => (
                  <div key={index} className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium w-4">{String.fromCharCode(65 + index)}.</span>
                    <Input
                      value={choice}
                      onChange={(e) => {
                        const newChoices = [...(newQuestion.choices || [])];
                        newChoices[index] = e.target.value;
                        setNewQuestion(prev => ({ ...prev, choices: newChoices }));
                      }}
                      placeholder={`선택지 ${index + 1}`}
                    />
                  </div>
                ))}
                <div className="mt-2">
                  <Label>정답</Label>
                  <Select 
                    value={newQuestion.answer.toString()} 
                    onValueChange={(value) => setNewQuestion(prev => ({ ...prev, answer: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {newQuestion.choices?.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {String.fromCharCode(65 + index)}번
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {newQuestion.type === 'Short' && (
              <div>
                <Label>정답</Label>
                <Input
                  value={newQuestion.answer as string}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="정답을 입력하세요"
                />
              </div>
            )}

            {newQuestion.type === 'Writing' && (
              <div className="space-y-2">
                <Label>서술형 설정</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>최대 단어 수</Label>
                    <Input
                      type="number"
                      value={newQuestion.writingSettings?.maxWords || 200}
                      onChange={(e) => setNewQuestion(prev => ({
                        ...prev,
                        writingSettings: {
                          ...prev.writingSettings,
                          maxWords: parseInt(e.target.value) || 200
                        }
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={newQuestion.writingSettings?.useRubric}
                      onCheckedChange={(checked) => setNewQuestion(prev => ({
                        ...prev,
                        writingSettings: {
                          ...prev.writingSettings,
                          useRubric: checked
                        }
                      }))}
                    />
                    <Label>루브릭 채점</Label>
                  </div>
                </div>
              </div>
            )}

            {newQuestion.type === 'Instruction' && (
              <div className="bg-muted p-3 rounded">
                <p className="text-sm text-muted-foreground">
                  안내문은 학생에게 지시사항을 전달하는 용도로, 별도의 답안이나 채점이 없습니다.
                </p>
              </div>
            )}

            {newQuestion.type === 'Passage' && (
              <div>
                <Label>지문 내용</Label>
                <Textarea
                  value={newQuestion.passageContent || ''}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, passageContent: e.target.value }))}
                  placeholder="지문 내용을 입력하세요"
                  rows={5}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveQuestion}>
                {editingQuestion ? "수정" : "추가"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Speaking Question Generator */}
      {showSpeakingGenerator && selectedSection && (
        <SpeakingQuestionGeneratorModal
          isOpen={showSpeakingGenerator}
          onClose={() => setShowSpeakingGenerator(false)}
          onGenerate={async (questions) => {
            if (!testData || !selectedVersion || !selectedSection) return;
            
            try {
              const success = await memoryRepo.addGeneratedSpeakingQuestions(
                testData.id,
                selectedVersion.id, 
                selectedSection.id,
                questions
              );
              
              if (success) {
                await refreshTestData();
                toast({
                  title: "성공",
                  description: `${questions.length}개의 스피킹 문항이 추가되었습니다.`,
                });
              }
            } catch (error) {
              console.error('스피킹 문항 생성 실패:', error);
              toast({
                title: "오류",
                description: "스피킹 문항 생성에 실패했습니다.",
                variant: "destructive",
              });
            }
          }}
          mode="section"
        />
      )}
    </>
  );
}
