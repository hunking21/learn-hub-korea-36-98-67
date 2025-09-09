import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useReadingQuestions, 
  useCreateReadingQuestion, 
  useUpdateReadingQuestion, 
  useDeleteReadingQuestion,
  ReadingQuestion 
} from "@/hooks/useReadingQuestions";

interface QuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passageId: string;
  passageTitle: string;
}

export function QuestionsDialog({ open, onOpenChange, passageId, passageTitle }: QuestionsDialogProps) {
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ReadingQuestion | null>(null);
  const { toast } = useToast();

  const { data: questions = [], isLoading } = useReadingQuestions(passageId);
  const createQuestion = useCreateReadingQuestion();
  const updateQuestion = useUpdateReadingQuestion();
  const deleteQuestion = useDeleteReadingQuestion();

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: ReadingQuestion) => {
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = async (question: ReadingQuestion) => {
    try {
      await deleteQuestion.mutateAsync({ id: question.id, passage_id: question.passage_id });
      toast({
        title: "문제 삭제 완료",
        description: "문제가 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "문제 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleSaveQuestion = async (formData: FormData) => {
    const questionType = formData.get('question_type') as string;
    const options = questionType === 'multiple_choice' 
      ? (formData.get('options') as string).split('\n').filter(option => option.trim())
      : null;

    const questionData = {
      passage_id: passageId,
      question_text: formData.get('question_text') as string,
      question_type: questionType as 'multiple_choice' | 'short_answer' | 'essay',
      options: options,
      correct_answer: formData.get('correct_answer') as string,
      points: parseInt(formData.get('points') as string),
    };

    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({ id: editingQuestion.id, ...questionData });
        toast({
          title: "문제 수정 완료",
          description: "문제가 성공적으로 수정되었습니다.",
        });
      } else {
        await createQuestion.mutateAsync(questionData);
        toast({
          title: "문제 생성 완료",
          description: "새 문제가 성공적으로 생성되었습니다.",
        });
      }
      setIsQuestionDialogOpen(false);
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "문제 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case 'multiple_choice': return '객관식';
      case 'short_answer': return '단답형';
      case 'essay': return '서술형';
      default: return type;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{passageTitle} - 문제 관리</DialogTitle>
            <DialogDescription>
              지문에 대한 문제를 관리합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                총 {questions.length}개의 문제
              </div>
              <Button onClick={handleCreateQuestion} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                문제 추가
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                문제가 없습니다. 첫 번째 문제를 추가해보세요.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>문제</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>배점</TableHead>
                    <TableHead>정답</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question, index) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <div className="font-medium">#{index + 1}</div>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {question.question_text}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getQuestionTypeText(question.question_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.points}점</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {question.correct_answer}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditQuestion(question as ReadingQuestion)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteQuestion(question as ReadingQuestion)}
                            disabled={deleteQuestion.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 문제 생성/수정 대화상자 */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? '문제 수정' : '새 문제 추가'}
            </DialogTitle>
            <DialogDescription>
              문제의 내용과 정보를 입력하세요
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveQuestion(new FormData(e.currentTarget));
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question_text">문제</Label>
              <Textarea
                id="question_text"
                name="question_text"
                defaultValue={editingQuestion?.question_text}
                rows={3}
                placeholder="문제를 입력하세요..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question_type">문제 유형</Label>
                <Select name="question_type" defaultValue={editingQuestion?.question_type || "multiple_choice"}>
                  <SelectTrigger>
                    <SelectValue placeholder="문제 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">객관식</SelectItem>
                    <SelectItem value="short_answer">단답형</SelectItem>
                    <SelectItem value="essay">서술형</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">배점</Label>
                <Input
                  id="points"
                  name="points"
                  type="number"
                  defaultValue={editingQuestion?.points || 1}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="options">선택지 (객관식인 경우, 한 줄에 하나씩)</Label>
              <Textarea
                id="options"
                name="options"
                defaultValue={editingQuestion?.options?.join('\n') || ''}
                rows={4}
                placeholder="1. 첫 번째 선택지&#10;2. 두 번째 선택지&#10;3. 세 번째 선택지&#10;4. 네 번째 선택지"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correct_answer">정답</Label>
              <Input
                id="correct_answer"
                name="correct_answer"
                defaultValue={editingQuestion?.correct_answer || ''}
                placeholder="정답을 입력하세요"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={createQuestion.isPending || updateQuestion.isPending}
              >
                {createQuestion.isPending || updateQuestion.isPending ? '저장 중...' : (editingQuestion ? '수정' : '생성')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}