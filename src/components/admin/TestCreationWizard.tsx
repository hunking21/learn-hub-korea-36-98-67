import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Save, Eye, Share2, Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestData {
  name: string;
  description: string;
  gradeLevel: string;
  timeLimit: number;
  isPublic: boolean;
  sections: Section[];
}

interface Section {
  id: string;
  name: string;
  timeLimit?: number;
  scoreRatio: number;
  questions: Question[];
}

interface Question {
  id: string;
  type: string;
  text: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "객관식" },
  { value: "short_answer", label: "주관식" },
  { value: "essay", label: "서술형" },
  { value: "speaking", label: "스피킹(녹음)" },
  { value: "listening", label: "리스닝" }
];

const GRADE_LEVELS = [
  { value: "초6", label: "초등학교 6학년" },
  { value: "중1", label: "중학교 1학년" },
  { value: "중2", label: "중학교 2학년" },
  { value: "중3", label: "중학교 3학년" },
  { value: "고1", label: "고등학교 1학년" },
  { value: "고2", label: "고등학교 2학년" },
  { value: "고3", label: "고등학교 3학년" }
];

export default function TestCreationWizard({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [testData, setTestData] = useState<TestData>({
    name: "",
    description: "",
    gradeLevel: "",
    timeLimit: 60,
    isPublic: true,
    sections: []
  });
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: "",
      scoreRatio: 25,
      questions: []
    };
    setTestData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: string) => {
    setTestData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addQuestion = (sectionId: string) => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: "multiple_choice",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1
    };
    
    updateSection(sectionId, {
      questions: [...(testData.sections.find(s => s.id === sectionId)?.questions || []), newQuestion]
    });
  };

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
    const section = testData.sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedQuestions = section.questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    
    updateSection(sectionId, { questions: updatedQuestions });
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    const section = testData.sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedQuestions = section.questions.filter(q => q.id !== questionId);
    updateSection(sectionId, { questions: updatedQuestions });
  };

  const handleSave = (isDraft = true) => {
    toast({
      title: isDraft ? "임시저장 완료" : "시험 배포 완료",
      description: isDraft ? "시험이 임시저장되었습니다." : "시험이 학생들에게 공개되었습니다."
    });
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">1단계: 기본 정보 입력</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="testName">테스트 이름</Label>
            <Input
              id="testName"
              value={testData.name}
              onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: 2025년 9월 진단고사, SSAT 모의고사"
            />
          </div>
          
          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={testData.description}
              onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="학생들에게 보여줄 간단한 안내 문구"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="gradeLevel">대상 학년/레벨</Label>
            <Select value={testData.gradeLevel} onValueChange={(value) => setTestData(prev => ({ ...prev, gradeLevel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="학년을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map(grade => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeLimit">시간 제한 (분)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={testData.timeLimit}
              onChange={(e) => setTestData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
              placeholder="60"
            />
            <p className="text-sm text-muted-foreground mt-1">0으로 설정하면 제한 없음</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={testData.isPublic}
              onCheckedChange={(checked) => setTestData(prev => ({ ...prev, isPublic: !!checked }))}
            />
            <Label htmlFor="isPublic">시험 공개</Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">2단계: 섹션(항목) 구성</h3>
        <Button onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          섹션 추가
        </Button>
      </div>

      <div className="space-y-4">
        {testData.sections.map((section, index) => (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">섹션 {index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>섹션 이름</Label>
                  <Input
                    value={section.name}
                    onChange={(e) => updateSection(section.id, { name: e.target.value })}
                    placeholder="예: 리딩, 라이팅, 매쓰"
                  />
                </div>
                <div>
                  <Label>섹션별 시간 제한 (분)</Label>
                  <Input
                    type="number"
                    value={section.timeLimit || ""}
                    onChange={(e) => updateSection(section.id, { timeLimit: parseInt(e.target.value) || undefined })}
                    placeholder="선택사항"
                  />
                </div>
              </div>
              <div>
                <Label>섹션 배점 비율 (%)</Label>
                <Input
                  type="number"
                  value={section.scoreRatio}
                  onChange={(e) => updateSection(section.id, { scoreRatio: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testData.sections.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>섹션을 추가하여 시험을 구성하세요.</p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">3단계: 문제 구성</h3>

      {testData.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">{section.name || "제목 없는 섹션"}</CardTitle>
              <Button
                onClick={() => addQuestion(section.id)}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                문제 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.questions.map((question, qIndex) => (
              <Card key={question.id} className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">문제 {qIndex + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(section.id, question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>문제 유형</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(section.id, question.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>배점</Label>
                      <Input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(section.id, question.id, { points: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>문제 내용</Label>
                    <Textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(section.id, question.id, { text: e.target.value })}
                      placeholder="문제를 입력하세요..."
                      rows={3}
                    />
                  </div>

                  {question.type === "multiple_choice" && (
                    <div>
                      <Label>선택지</Label>
                      <div className="space-y-2">
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optIndex] = e.target.value;
                                updateQuestion(section.id, question.id, { options: newOptions });
                              }}
                              placeholder={`선택지 ${optIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2">
                        <Label>정답</Label>
                        <Select
                          value={question.correctAnswer}
                          onValueChange={(value) => updateQuestion(section.id, question.id, { correctAnswer: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="정답 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {question.options?.map((_, optIndex) => (
                              <SelectItem key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                                {String.fromCharCode(65 + optIndex)}번
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {section.questions.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>이 섹션에 문제를 추가하세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">4단계: 저장 및 배포</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>시험 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">시험 이름:</span> {testData.name}
            </div>
            <div>
              <span className="font-medium">대상 학년:</span> {testData.gradeLevel}
            </div>
            <div>
              <span className="font-medium">시간 제한:</span> {testData.timeLimit === 0 ? "제한 없음" : `${testData.timeLimit}분`}
            </div>
            <div>
              <span className="font-medium">공개 상태:</span> {testData.isPublic ? "공개" : "비공개"}
            </div>
          </div>
          
          <div>
            <span className="font-medium">섹션 구성:</span>
            <div className="mt-2 space-y-1">
              {testData.sections.map((section, index) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span>{section.name} ({section.questions.length}문제, {section.scoreRatio}%)</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>총 문제 수: {testData.sections.reduce((total, section) => total + section.questions.length, 0)}개</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => handleSave(true)}>
          <Save className="h-4 w-4 mr-2" />
          임시저장
        </Button>
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          미리보기
        </Button>
        <Button onClick={() => handleSave(false)}>
          <Share2 className="h-4 w-4 mr-2" />
          배포하기
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return testData.name && testData.gradeLevel;
      case 2: return testData.sections.length > 0 && testData.sections.every(s => s.name);
      case 3: return testData.sections.every(s => s.questions.length > 0);
      case 4: return true;
      default: return false;
    }
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>새 시험 만들기</CardTitle>
            <CardDescription>
              4단계 과정을 통해 새로운 시험을 생성합니다.
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mt-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === currentStep ? 'bg-primary text-primary-foreground' : 
                  step < currentStep ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
              `}>
                {step}
              </div>
              {step < 4 && <div className="w-8 h-0.5 bg-muted mx-2" />}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="min-h-[600px]">
        {renderCurrentStep()}
      </CardContent>

      <div className="flex justify-between p-6 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          이전 단계
        </Button>
        
        {currentStep < 4 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            다음 단계
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </Card>
  );
}