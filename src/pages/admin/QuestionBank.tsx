import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuestionType } from '@/types/schema';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search, Download, Upload, Filter, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { memoryRepo } from "@/repositories/memoryRepo";
import type { QuestionBankItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SpeakingQuestionGeneratorModal } from "@/components/admin/SpeakingQuestionGeneratorModal";

export default function QuestionBank() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'MCQ' | 'Short' | 'Speaking'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  const [showSpeakingGenerator, setShowSpeakingGenerator] = useState(false);
  
  // Form states
  const [formType, setFormType] = useState<QuestionType>('MCQ');
  const [formPrompt, setFormPrompt] = useState("");
  const [formChoices, setFormChoices] = useState<string[]>(['', '', '', '']);
  const [formAnswer, setFormAnswer] = useState<number | string>(0);
  const [formPoints, setFormPoints] = useState("");
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [formTags, setFormTags] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, searchTerm, filterType, filterDifficulty]);

  const loadQuestions = async () => {
    try {
      const questionList = await memoryRepo.getQuestionBank();
      setQuestions(questionList);
    } catch (error) {
      console.error('Question bank load failed:', error);
      toast({
        title: "오류",
        description: "문제은행을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = questions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.type === filterType);
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }

    setFilteredQuestions(filtered);
  };

  const resetForm = () => {
    setFormType('MCQ');
    setFormPrompt("");
    setFormChoices(['', '', '', '']);
    setFormAnswer(0);
    setFormPoints("");
    setFormDifficulty('Medium');
    setFormTags("");
  };

  const handleAddQuestion = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEditQuestion = (question: QuestionBankItem) => {
    setEditingQuestion(question);
    setFormType(question.type);
    setFormPrompt(question.prompt);
    setFormChoices(question.choices || ['', '', '', '']);
    const answerValue = question.answer;
    const defaultAnswer = question.type === 'MCQ' ? 0 : 
                          Array.isArray(answerValue) ? answerValue[0] || '' : 
                          answerValue || '';
    setFormAnswer(defaultAnswer);
    setFormPoints(question.points.toString());
    setFormDifficulty(question.difficulty);
    setFormTags(question.tags.join(', '));
    setIsEditDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!formPrompt.trim() || !formPoints.trim()) {
      toast({
        title: "오류",
        description: "문제와 점수를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const points = parseInt(formPoints);
    if (isNaN(points) || points <= 0) {
      toast({
        title: "오류",
        description: "올바른 점수를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    let finalChoices: string[] | undefined;
    let finalAnswer: number | string | undefined;

    if (formType === 'MCQ') {
      if (formChoices.some(choice => !choice.trim())) {
        toast({
          title: "오류",
          description: "모든 선택지를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }
      finalChoices = formChoices;
      finalAnswer = typeof formAnswer === 'number' ? formAnswer : 0;
    } else if (formType === 'Short') {
      finalAnswer = typeof formAnswer === 'string' ? formAnswer : '';
    }

    const questionData = {
      type: formType,
      prompt: formPrompt,
      choices: finalChoices,
      answer: finalAnswer,
      points: points,
      difficulty: formDifficulty,
      tags: formTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    try {
      if (editingQuestion) {
        await memoryRepo.updateQuestionInBank(editingQuestion.id, questionData);
        toast({
          title: "수정 완료",
          description: "문항이 수정되었습니다.",
        });
        setIsEditDialogOpen(false);
        setEditingQuestion(null);
      } else {
        await memoryRepo.addQuestionToBank(questionData);
        toast({
          title: "추가 완료",
          description: "문항이 문제은행에 추가되었습니다.",
        });
        setIsAddDialogOpen(false);
      }
      
      resetForm();
      await loadQuestions();
    } catch (error) {
      console.error('Question save failed:', error);
      toast({
        title: "오류",
        description: "문항 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (question: QuestionBankItem) => {
    try {
      await memoryRepo.deleteQuestionFromBank(question.id);
      toast({
        title: "삭제 완료",
        description: "문항이 삭제되었습니다.",
      });
      await loadQuestions();
    } catch (error) {
      console.error('Question delete failed:', error);
      toast({
        title: "오류",
        description: "문항 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSpeakingQuestions = async (questions: Omit<QuestionBankItem, 'id' | 'createdAt'>[]) => {
    try {
      for (const question of questions) {
        await memoryRepo.addQuestionToBank(question);
      }
      
      toast({
        title: "성공",
        description: `${questions.length}개의 스피킹 문항이 문제은행에 추가되었습니다.`,
      });
      
      await loadQuestions();
    } catch (error) {
      console.error('Failed to add generated questions:', error);
      toast({
        title: "오류",
        description: "스피킹 문항 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleExportQuestions = async () => {
    try {
      const exportData = await memoryRepo.exportQuestionBank();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-bank-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "내보내기 완료",
        description: "문제은행이 성공적으로 내보내졌습니다.",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "오류",
        description: "내보내기에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleImportQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const result = await memoryRepo.importQuestionBank(content);
        
        if (result.success) {
          toast({
            title: "가져오기 완료",
            description: result.message,
          });
          await loadQuestions();
        } else {
          toast({
            title: "가져오기 실패",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          title: "오류",
          description: "파일 읽기에 실패했습니다.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-foreground">문제은행</h1>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">문제은행</h1>
            <p className="text-muted-foreground mt-2">
              문항을 관리하고 시험에 추가하세요.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSpeakingGenerator(true)} variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              스피킹 질문 자동 생성
            </Button>
            <Button onClick={handleAddQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              문항 추가
            </Button>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="문항 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={(value: typeof filterType) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 유형</SelectItem>
                  <SelectItem value="MCQ">선택형</SelectItem>
                  <SelectItem value="Short">단답형</SelectItem>
                  <SelectItem value="Speaking">말하기</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterDifficulty} onValueChange={(value: typeof filterDifficulty) => setFilterDifficulty(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="난이도" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 난이도</SelectItem>
                  <SelectItem value="Easy">쉬움</SelectItem>
                  <SelectItem value="Medium">보통</SelectItem>
                  <SelectItem value="Hard">어려움</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportQuestions}>
                  <Download className="w-4 h-4 mr-2" />
                  내보내기
                </Button>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    가져오기
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportQuestions}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              문항 목록
              <Badge variant="secondary">{filteredQuestions.length}개 문항</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {questions.length === 0 ? "등록된 문항이 없습니다" : "검색 조건에 맞는 문항이 없습니다"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{question.type}</Badge>
                          <Badge variant="outline">{question.difficulty}</Badge>
                          <span className="text-sm text-muted-foreground">{question.points}점</span>
                        </div>
                        
                        <p className="font-medium">{question.prompt}</p>
                        
                        {question.type === 'MCQ' && question.choices && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {question.choices.map((choice, idx) => (
                              <div key={idx} className={`pl-2 ${idx === question.answer ? 'font-medium text-green-600' : ''}`}>
                                {idx + 1}. {choice} {idx === question.answer && '✓'}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'Short' && question.answer && (
                          <div className="text-sm text-muted-foreground">
                            정답: {question.answer}
                          </div>
                        )}
                        
                        {question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {question.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditQuestion(question)}
                          className="text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>문항 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 문항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteQuestion(question)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Question Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 문항 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">문항 유형</label>
                  <Select value={formType} onValueChange={(value: typeof formType) => setFormType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">선택형</SelectItem>
                      <SelectItem value="Short">단답형</SelectItem>
                      <SelectItem value="Speaking">말하기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">난이도</label>
                  <Select value={formDifficulty} onValueChange={(value: typeof formDifficulty) => setFormDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">쉬움</SelectItem>
                      <SelectItem value="Medium">보통</SelectItem>
                      <SelectItem value="Hard">어려움</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">문제</label>
                <Textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="문제를 입력하세요"
                  rows={3}
                />
              </div>

              {formType === 'MCQ' && (
                <div>
                  <label className="text-sm font-medium">선택지</label>
                  <div className="space-y-2">
                    {formChoices.map((choice, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm w-6">{index + 1}.</span>
                        <Input
                          value={choice}
                          onChange={(e) => {
                            const newChoices = [...formChoices];
                            newChoices[index] = e.target.value;
                            setFormChoices(newChoices);
                          }}
                          placeholder={`선택지 ${index + 1}`}
                        />
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={formAnswer === index}
                          onChange={() => setFormAnswer(index)}
                          className="ml-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formType === 'Short' && (
                <div>
                  <label className="text-sm font-medium">정답</label>
                  <Input
                    value={formAnswer as string}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    placeholder="정답을 입력하세요"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">점수</label>
                  <Input
                    type="number"
                    value={formPoints}
                    onChange={(e) => setFormPoints(e.target.value)}
                    placeholder="점수"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
                  <Input
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="태그1, 태그2, ..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleSaveQuestion}>
                  추가
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Question Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>문항 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">문항 유형</label>
                  <Select value={formType} onValueChange={(value: typeof formType) => setFormType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">선택형</SelectItem>
                      <SelectItem value="Short">단답형</SelectItem>
                      <SelectItem value="Speaking">말하기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">난이도</label>
                  <Select value={formDifficulty} onValueChange={(value: typeof formDifficulty) => setFormDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">쉬움</SelectItem>
                      <SelectItem value="Medium">보통</SelectItem>
                      <SelectItem value="Hard">어려움</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">문제</label>
                <Textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="문제를 입력하세요"
                  rows={3}
                />
              </div>

              {formType === 'MCQ' && (
                <div>
                  <label className="text-sm font-medium">선택지</label>
                  <div className="space-y-2">
                    {formChoices.map((choice, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm w-6">{index + 1}.</span>
                        <Input
                          value={choice}
                          onChange={(e) => {
                            const newChoices = [...formChoices];
                            newChoices[index] = e.target.value;
                            setFormChoices(newChoices);
                          }}
                          placeholder={`선택지 ${index + 1}`}
                        />
                        <input
                          type="radio"
                          name="correct-answer-edit"
                          checked={formAnswer === index}
                          onChange={() => setFormAnswer(index)}
                          className="ml-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formType === 'Short' && (
                <div>
                  <label className="text-sm font-medium">정답</label>
                  <Input
                    value={formAnswer as string}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    placeholder="정답을 입력하세요"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">점수</label>
                  <Input
                    type="number"
                    value={formPoints}
                    onChange={(e) => setFormPoints(e.target.value)}
                    placeholder="점수"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
                  <Input
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="태그1, 태그2, ..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleSaveQuestion}>
                  수정
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Speaking Question Generator Modal */}
        <SpeakingQuestionGeneratorModal
          isOpen={showSpeakingGenerator}
          onClose={() => setShowSpeakingGenerator(false)}
          onGenerate={handleGenerateSpeakingQuestions}
          mode="bank"
        />
      </div>
    </AdminLayout>
  );
}