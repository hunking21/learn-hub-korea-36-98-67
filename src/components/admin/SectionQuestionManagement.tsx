import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TestSection {
  id: string;
  name: string;
  version_id: string;
}

interface SectionQuestion {
  id: string;
  section_id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
  created_at: string;
}

interface SectionQuestionManagementProps {
  section: TestSection;
  onBack: () => void;
  onUpdate: () => void;
}

export function SectionQuestionManagement({ section, onBack, onUpdate }: SectionQuestionManagementProps) {
  const [questions, setQuestions] = useState<SectionQuestion[]>([]);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SectionQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "multiple_choice",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    points: 1
  });
  const { toast } = useToast();
  const { sessionToken } = useAuth();

  const QUESTION_TYPES = [
    { value: "multiple_choice", label: "객관식 (4지선다)" },
    { value: "true_false", label: "참/거짓" },
    { value: "short_answer", label: "단답형" },
    { value: "essay", label: "서술형" }
  ];

  const loadQuestions = async () => {
    try {
      console.log('Loading questions for section:', section.id);
      
      const { data, error } = await supabase
        .from('test_section_questions')
        .select('*')
        .eq('section_id', section.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading questions:', error);
        throw error;
      }
      
      console.log('Loaded questions:', data?.length || 0);
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "오류",
        description: "문제 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const createQuestion = async () => {
    try {
      // Ensure session token is set before database operation
      if (sessionToken) {
        await Promise.all([
          supabase.rpc('set_request_header', {
            key: 'request.jwt.claims',
            value: JSON.stringify({ session_token: sessionToken })
          }),
          supabase.rpc('set_request_header', {
            key: 'app.session_token',
            value: sessionToken
          })
        ]);
      }

      // Get next order index
      const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order_index)) : -1;

      // Prepare options based on question type
      let options = null;
      if (questionForm.question_type === "multiple_choice") {
        options = questionForm.options.filter(opt => opt.trim() !== "");
      } else if (questionForm.question_type === "true_false") {
        options = ["참", "거짓"];
      }

      const { error } = await supabase
        .from('test_section_questions')
        .insert({
          section_id: section.id,
          question_text: questionForm.question_text,
          question_type: questionForm.question_type,
          options: options,
          correct_answer: questionForm.correct_answer,
          explanation: questionForm.explanation || null,
          points: questionForm.points,
          order_index: maxOrder + 1
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: "문제가 추가되었습니다."
      });

      setShowCreateQuestion(false);
      resetForm();
      loadQuestions();
      onUpdate();
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "오류",
        description: "문제 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const updateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      // Ensure session token is set before database operation
      if (sessionToken) {
        await Promise.all([
          supabase.rpc('set_request_header', {
            key: 'request.jwt.claims',
            value: JSON.stringify({ session_token: sessionToken })
          }),
          supabase.rpc('set_request_header', {
            key: 'app.session_token',
            value: sessionToken
          })
        ]);
      }

      // Prepare options based on question type
      let options = null;
      if (questionForm.question_type === "multiple_choice") {
        options = questionForm.options.filter(opt => opt.trim() !== "");
      } else if (questionForm.question_type === "true_false") {
        options = ["참", "거짓"];
      }

      const { error } = await supabase
        .from('test_section_questions')
        .update({
          question_text: questionForm.question_text,
          question_type: questionForm.question_type,
          options: options,
          correct_answer: questionForm.correct_answer,
          explanation: questionForm.explanation || null,
          points: questionForm.points
        })
        .eq('id', editingQuestion.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "문제가 수정되었습니다."
      });

      setEditingQuestion(null);
      resetForm();
      loadQuestions();
      onUpdate();
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "오류",
        description: "문제 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('이 문제를 삭제하시겠습니까?')) return;

    try {
      // Ensure session token is set before database operation
      if (sessionToken) {
        await Promise.all([
          supabase.rpc('set_request_header', {
            key: 'request.jwt.claims',
            value: JSON.stringify({ session_token: sessionToken })
          }),
          supabase.rpc('set_request_header', {
            key: 'app.session_token',
            value: sessionToken
          })
        ]);
      }

      const { error } = await supabase
        .from('test_section_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "문제가 삭제되었습니다."
      });

      loadQuestions();
      onUpdate();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "오류",
        description: "문제 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    try {
      // Ensure session token is set before database operation
      if (sessionToken) {
        await Promise.all([
          supabase.rpc('set_request_header', {
            key: 'request.jwt.claims',
            value: JSON.stringify({ session_token: sessionToken })
          }),
          supabase.rpc('set_request_header', {
            key: 'app.session_token',
            value: sessionToken
          })
        ]);
      }

      const question1 = questions[currentIndex];
      const question2 = questions[newIndex];

      // Swap order indices
      const updates = [
        supabase.from('test_section_questions').update({ order_index: question2.order_index }).eq('id', question1.id),
        supabase.from('test_section_questions').update({ order_index: question1.order_index }).eq('id', question2.id)
      ];

      await Promise.all(updates);
      loadQuestions();
    } catch (error) {
      console.error('Error moving question:', error);
      toast({
        title: "오류",
        description: "문제 순서 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleEditQuestion = (question: SectionQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || ["", "", "", ""],
      correct_answer: question.correct_answer,
      explanation: question.explanation || "",
      points: question.points
    });
  };

  const resetForm = () => {
    setQuestionForm({
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      points: 1
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  useEffect(() => {
    loadQuestions();
  }, [section.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            섹션 목록으로
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{section.name} - 문제 관리</h3>
            <p className="text-sm text-muted-foreground">
              이 섹션의 문제를 관리합니다 (총 {questions.length}개)
            </p>
          </div>
        </div>
        
        <Dialog open={showCreateQuestion} onOpenChange={setShowCreateQuestion}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              문제 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 문제 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="question_text">문제</Label>
                <Textarea
                  id="question_text"
                  placeholder="문제를 입력하세요"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="question_type">문제 유형</Label>
                <Select 
                  value={questionForm.question_type} 
                  onValueChange={(value) => setQuestionForm(prev => ({ ...prev, question_type: value }))}
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

              {questionForm.question_type === "multiple_choice" && (
                <div>
                  <Label>선택지</Label>
                  <div className="space-y-2">
                    {questionForm.options.map((option, index) => (
                      <Input
                        key={index}
                        placeholder={`선택지 ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="correct_answer">정답</Label>
                {questionForm.question_type === "multiple_choice" ? (
                  <Select 
                    value={questionForm.correct_answer} 
                    onValueChange={(value) => setQuestionForm(prev => ({ ...prev, correct_answer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="정답 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionForm.options.filter(opt => opt.trim() !== "").map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : questionForm.question_type === "true_false" ? (
                  <Select 
                    value={questionForm.correct_answer} 
                    onValueChange={(value) => setQuestionForm(prev => ({ ...prev, correct_answer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="정답 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="참">참</SelectItem>
                      <SelectItem value="거짓">거짓</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="correct_answer"
                    placeholder="정답을 입력하세요"
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                  />
                )}
              </div>

              <div>
                <Label htmlFor="explanation">해설 (선택사항)</Label>
                <Textarea
                  id="explanation"
                  placeholder="문제 해설을 입력하세요"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="points">배점</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateQuestion(false)}>
                  취소
                </Button>
                <Button onClick={createQuestion} disabled={!questionForm.question_text.trim() || !questionForm.correct_answer.trim()}>
                  추가
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        문제 {index + 1}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {QUESTION_TYPES.find(t => t.value === question.question_type)?.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.points}점
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 whitespace-pre-wrap">
                      {question.question_text}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveQuestion(question.id, 'up')}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === questions.length - 1}
                      onClick={() => moveQuestion(question.id, 'down')}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit className="h-3 w-3" />
                      수정
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      삭제
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {question.options && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">선택지:</p>
                    <div className="space-y-1">
                      {question.options.map((option: string, optIndex: number) => (
                        <div key={optIndex} className={`text-sm p-2 rounded ${
                          option === question.correct_answer ? 'bg-green-100 text-green-800' : 'bg-gray-50'
                        }`}>
                          {optIndex + 1}. {option}
                          {option === question.correct_answer && <span className="ml-2 font-medium">(정답)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!question.options && (
                  <div className="mb-3">
                    <p className="text-sm font-medium">정답: <span className="text-green-600">{question.correct_answer}</span></p>
                  </div>
                )}
                
                {question.explanation && (
                  <div>
                    <p className="text-sm font-medium mb-1">해설:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 문제가 없습니다</h3>
            <p className="text-muted-foreground mb-4 text-center">
              첫 번째 문제를 추가해보세요
            </p>
            <Button onClick={() => setShowCreateQuestion(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              문제 추가
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 문제 수정 다이얼로그 */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>문제 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="edit_question_text">문제</Label>
              <Textarea
                id="edit_question_text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_question_type">문제 유형</Label>
              <Select 
                value={questionForm.question_type} 
                onValueChange={(value) => setQuestionForm(prev => ({ ...prev, question_type: value }))}
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

            {questionForm.question_type === "multiple_choice" && (
              <div>
                <Label>선택지</Label>
                <div className="space-y-2">
                  {questionForm.options.map((option, index) => (
                    <Input
                      key={index}
                      placeholder={`선택지 ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit_correct_answer">정답</Label>
              {questionForm.question_type === "multiple_choice" ? (
                <Select 
                  value={questionForm.correct_answer} 
                  onValueChange={(value) => setQuestionForm(prev => ({ ...prev, correct_answer: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="정답 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionForm.options.filter(opt => opt.trim() !== "").map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : questionForm.question_type === "true_false" ? (
                <Select 
                  value={questionForm.correct_answer} 
                  onValueChange={(value) => setQuestionForm(prev => ({ ...prev, correct_answer: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="정답 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="참">참</SelectItem>
                    <SelectItem value="거짓">거짓</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="edit_correct_answer"
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                />
              )}
            </div>

            <div>
              <Label htmlFor="edit_explanation">해설 (선택사항)</Label>
              <Textarea
                id="edit_explanation"
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit_points">배점</Label>
              <Input
                id="edit_points"
                type="number"
                min="1"
                value={questionForm.points}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                취소
              </Button>
              <Button onClick={updateQuestion}>
                수정
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}