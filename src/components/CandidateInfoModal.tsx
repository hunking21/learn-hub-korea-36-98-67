import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { User, GraduationCap, Phone, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CandidateInfo {
  name: string;
  system: 'KR' | 'US' | 'UK';
  grade: string;
  phone?: string;
  note?: string;
}

interface CandidateInfoModalProps {
  isOpen: boolean;
  onSubmit: (candidateInfo: CandidateInfo) => Promise<void>;
  testName: string;
}

const GRADES = {
  KR: ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'],
  US: ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
  UK: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']
};

export function CandidateInfoModal({ isOpen, onSubmit, testName }: CandidateInfoModalProps) {
  const [name, setName] = useState("");
  const [system, setSystem] = useState<'KR' | 'US' | 'UK'>('KR');
  const [grade, setGrade] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "오류",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!grade) {
      toast({
        title: "오류", 
        description: "학년을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        system,
        grade,
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
      });
    } catch (error) {
      console.error('Failed to submit candidate info:', error);
      toast({
        title: "오류",
        description: "응시자 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            응시자 정보 입력
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">
              시험: {testName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="system" className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    학제 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={system} onValueChange={(value: 'KR' | 'US' | 'UK') => {
                    setSystem(value);
                    setGrade(""); // Reset grade when system changes
                  }}>
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

                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium">
                    학년 <span className="text-red-500">*</span>
                  </Label>
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

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  연락처 <span className="text-muted-foreground">(선택사항)</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="연락처를 입력하세요"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  메모 <span className="text-muted-foreground">(선택사항)</span>
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="추가 메모가 있다면 입력하세요"
                  rows={3}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "저장 중..." : "시험 시작"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}