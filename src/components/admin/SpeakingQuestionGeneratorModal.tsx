import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateSpeakingQuestions, convertToQuestionBankItems } from "@/utils/speakingQuestionGenerator";
import { Sparkles, RefreshCw, Eye, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpeakingQuestionGeneratorModalProps {
  trigger?: React.ReactNode;
  onGenerate: (questions: Omit<import("@/types").QuestionBankItem, 'id' | 'createdAt'>[]) => Promise<void>;
  onAddToSection?: (questions: Omit<import("@/types").QuestionBankItem, 'id' | 'createdAt'>[]) => Promise<void>;
  excludeRecentPrompts?: string[];
  mode?: 'bank' | 'section';
  isOpen?: boolean;
  onClose?: () => void;
}

const GRADES = {
  KR: ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'],
  US: ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
  UK: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']
};

export function SpeakingQuestionGeneratorModal({
  trigger,
  onGenerate,
  onAddToSection,
  excludeRecentPrompts = [],
  mode = 'bank',
  isOpen: controlledOpen,
  onClose
}: SpeakingQuestionGeneratorModalProps) {
  const [open, setOpen] = useState(false);
  const [system, setSystem] = useState<'KR' | 'US' | 'UK'>('KR');
  const [grade, setGrade] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [count, setCount] = useState(5);
  const [seed, setSeed] = useState(Date.now());
  const [preview, setPreview] = useState<Omit<import("@/types").QuestionBankItem, 'id' | 'createdAt'>[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const isModalOpen = isControlled ? controlledOpen : open;
  
  const handleClose = () => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setOpen(false);
    }
    setPreview([]);
  };

  const handleGenerate = async () => {
    if (!grade) {
      toast({
        title: "오류",
        description: "학년을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (count < 1 || count > 20) {
      toast({
        title: "오류", 
        description: "생성 개수는 1-20개 사이여야 합니다.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const generatedQuestions = generateSpeakingQuestions(
        { system, grade, difficulty, count, seed },
        excludeRecentPrompts
      );
      
      const questionBankItems = convertToQuestionBankItems(generatedQuestions);
      setPreview(questionBankItems);
      
      toast({
        title: "성공",
        description: `${questionBankItems.length}개의 스피킹 문항이 생성되었습니다.`
      });
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast({
        title: "오류",
        description: "문항 생성에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (preview.length === 0) return;
    
    try {
      if (mode === 'section' && onAddToSection) {
        await onAddToSection(preview);
      } else {
        await onGenerate(preview);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to add questions:', error);
      toast({
        title: "오류",
        description: "문항 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const refreshSeed = () => {
    setSeed(Date.now());
    if (preview.length > 0) {
      handleGenerate();
    }
  };

  const defaultTrigger = (
    <Button>
      <Sparkles className="w-4 h-4 mr-2" />
      {mode === 'section' ? '자동 생성으로 채우기' : '스피킹 질문 자동 생성'}
    </Button>
  );

  return (
    <Dialog open={isModalOpen} onOpenChange={isControlled ? undefined : setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            스피킹 질문 자동 생성
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 설정 패널 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">생성 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="system">학제</Label>
                    <Select value={system} onValueChange={(value: 'KR' | 'US' | 'UK') => setSystem(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="학제 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KR">한국 (KR)</SelectItem>
                        <SelectItem value="US">미국 (US)</SelectItem>
                        <SelectItem value="UK">영국 (UK)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="grade">학년</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="학년 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES[system].map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="difficulty">난이도</Label>
                  <Select value={difficulty} onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">쉬움 (5점)</SelectItem>
                      <SelectItem value="Medium">보통 (10점)</SelectItem>
                      <SelectItem value="Hard">어려움 (15점)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="count">생성 개수</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    placeholder="1-20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="seed">시드 값</Label>
                    <Input
                      id="seed"
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      placeholder="시드 값"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshSeed}
                    className="mt-6"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    미리보기 생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 미리보기 패널 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  미리보기
                  {preview.length > 0 && (
                    <Badge variant="secondary">{preview.length}개 문항</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preview.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    먼저 설정을 완료하고 미리보기를 생성해보세요.
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-64 mb-4">
                      <div className="space-y-3">
                        {preview.map((question, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium leading-relaxed">
                                  {question.prompt}
                                </p>
                                <Badge className="ml-2 shrink-0">
                                  {question.points}점
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {question.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {question.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{question.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleConfirm}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {mode === 'section' ? '섹션에 추가' : '문제은행에 추가'}
                      </Button>
                      <Button variant="outline" onClick={handleClose}>
                        취소
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}