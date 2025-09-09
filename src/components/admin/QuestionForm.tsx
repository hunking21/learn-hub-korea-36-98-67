import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2 } from "lucide-react";
import type { QuestionBankItem } from "@/types";

interface QuestionFormProps {
  question?: QuestionBankItem;
  onSubmit: (question: Omit<QuestionBankItem, 'id' | 'createdAt'>) => Promise<boolean>;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

export function QuestionForm({ question, onSubmit, onClose, trigger }: QuestionFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: question?.type || 'MCQ' as const,
    prompt: question?.prompt || '',
    choices: question?.choices || ['', '', '', ''],
    answer: question?.answer || '',
    points: question?.points || 1,
    tags: question?.tags || [],
    difficulty: question?.difficulty || 'Medium' as const,
    category: question?.category || '',
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let processedAnswer: number | string | string[] = formData.answer;
      
      // MCQ의 경우 answer를 숫자 인덱스로 변환
      if (formData.type === 'MCQ') {
        processedAnswer = parseInt(formData.answer as string) || 0;
      }

      const questionData = {
        type: formData.type,
        prompt: formData.prompt.trim(),
        choices: formData.type === 'MCQ' ? formData.choices.filter(c => c.trim()) : undefined,
        answer: formData.type !== 'Speaking' ? processedAnswer : undefined,
        points: formData.points,
        tags: formData.tags,
        difficulty: formData.difficulty,
        category: formData.category.trim() || undefined,
      };

      const success = await onSubmit(questionData);
      if (success) {
        setOpen(false);
        onClose?.();
        if (!question) {
          // Reset form for new questions
          setFormData({
            type: 'MCQ',
            prompt: '',
            choices: ['', '', '', ''],
            answer: '',
            points: 1,
            tags: [],
            difficulty: 'Medium',
            category: '',
          });
          setNewTag('');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const updateChoice = (index: number, value: string) => {
    const newChoices = [...formData.choices];
    newChoices[index] = value;
    setFormData(prev => ({ ...prev, choices: newChoices }));
  };

  const addChoice = () => {
    if (formData.choices.length < 6) {
      setFormData(prev => ({
        ...prev,
        choices: [...prev.choices, '']
      }));
    }
  };

  const removeChoice = (index: number) => {
    if (formData.choices.length > 2) {
      const newChoices = formData.choices.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, choices: newChoices }));
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 문항 유형 */}
        <div className="space-y-2">
          <Label htmlFor="type">문항 유형</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">객관식</SelectItem>
              <SelectItem value="Short">주관식</SelectItem>
              <SelectItem value="Speaking">말하기</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 난이도 */}
        <div className="space-y-2">
          <Label htmlFor="difficulty">난이도</Label>
          <Select value={formData.difficulty} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 점수 */}
        <div className="space-y-2">
          <Label htmlFor="points">점수</Label>
          <Input
            id="points"
            type="number"
            min="1"
            max="100"
            value={formData.points}
            onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
          />
        </div>

        {/* 카테고리 */}
        <div className="space-y-2">
          <Label htmlFor="category">카테고리 (선택사항)</Label>
          <Input
            id="category"
            placeholder="예: 문법, 어휘, 독해 등"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          />
        </div>
      </div>

      {/* 문제 내용 */}
      <div className="space-y-2">
        <Label htmlFor="prompt">문제 내용</Label>
        <Textarea
          id="prompt"
          placeholder="문제를 입력하세요..."
          value={formData.prompt}
          onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
          className="min-h-[100px]"
          required
        />
      </div>

      {/* 객관식 선택지 */}
      {formData.type === 'MCQ' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">선택지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">{index + 1}.</span>
                <Input
                  value={choice}
                  onChange={(e) => updateChoice(index, e.target.value)}
                  placeholder={`선택지 ${index + 1}`}
                  className="flex-1"
                />
                {formData.choices.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChoice(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {formData.choices.length < 6 && (
              <Button type="button" variant="outline" size="sm" onClick={addChoice}>
                <Plus className="w-4 h-4 mr-1" />
                선택지 추가
              </Button>
            )}

            <div className="space-y-2 pt-2 border-t">
              <Label>정답</Label>
              <Select value={formData.answer.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, answer: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="정답 선택" />
                </SelectTrigger>
                <SelectContent>
                  {formData.choices.map((choice, index) => (
                    choice.trim() && (
                      <SelectItem key={index} value={index.toString()}>
                        {index + 1}. {choice.slice(0, 30)}{choice.length > 30 ? '...' : ''}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 주관식 정답 */}
      {formData.type === 'Short' && (
        <div className="space-y-2">
          <Label htmlFor="answer">모범 답안</Label>
          <Textarea
            id="answer"
            placeholder="모범 답안을 입력하세요..."
            value={formData.answer as string}
            onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
          />
        </div>
      )}

      {/* 태그 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">태그</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="태그 입력..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} size="sm">
              추가
            </Button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : question ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            문항 추가
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question ? '문항 수정' : '새 문항 추가'}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}