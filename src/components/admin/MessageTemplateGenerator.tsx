import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, MessageSquare, Send, Users } from 'lucide-react';
import { Student } from '@/utils/studentUtils';
import { resultTokenManager } from '@/utils/resultTokenUtils';
import { format } from 'date-fns';

interface MessageTemplateGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
}

export function MessageTemplateGenerator({ 
  isOpen, 
  onClose, 
  selectedStudents 
}: MessageTemplateGeneratorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'sms' | 'kakao'>('sms');
  const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en'>('ko');

  const generateTemplate = (student: Student, platform: 'sms' | 'kakao', language: 'ko' | 'en') => {
    // Mock data - in real app, this would come from actual test results
    const mockAttempt = {
      testName: '중간고사 영어 시험',
      completedAt: new Date().toISOString(),
      score: 85,
      maxScore: 100,
      resultToken: 'ABC123XYZ789'
    };

    const resultUrl = `${window.location.origin}/r/${mockAttempt.resultToken}`;
    const dateStr = format(new Date(mockAttempt.completedAt), 'yyyy.MM.dd');

    if (language === 'ko') {
      if (platform === 'sms') {
        return `[TN Academy] 안녕하세요.

${student.name} 학생의 시험 결과가 나왔습니다.

📝 시험명: ${mockAttempt.testName}
📅 시험일: ${dateStr}
📊 점수: ${mockAttempt.score}/${mockAttempt.maxScore}점

자세한 결과는 아래 링크에서 확인하실 수 있습니다:
${resultUrl}

※ 링크는 30일간 유효합니다.
※ 문의사항은 담당 교사에게 연락해주세요.

TN Academy`;
      } else {
        return `🎓 TN Academy 시험 결과 안내

안녕하세요! ${student.name} 학생의 시험 결과를 안내드립니다.

✅ 시험 정보
• 시험명: ${mockAttempt.testName}  
• 응시일: ${dateStr}
• 획득점수: ${mockAttempt.score}점 / ${mockAttempt.maxScore}점

📊 자세한 결과표 보기
${resultUrl}

💡 결과표에서는 영역별 상세 점수와 학습 가이드를 확인하실 수 있습니다.

⏰ 링크 유효기간: 30일
❓ 문의: 담당 교사

감사합니다. 🙏`;
      }
    } else {
      if (platform === 'sms') {
        return `[TN Academy] Hello!

${student.name}'s test results are ready.

📝 Test: ${mockAttempt.testName}
📅 Date: ${dateStr}
📊 Score: ${mockAttempt.score}/${mockAttempt.maxScore}

View detailed results:
${resultUrl}

※ Link valid for 30 days
※ Contact your teacher for questions

TN Academy`;
      } else {
        return `🎓 TN Academy Test Results

Hello! Here are ${student.name}'s test results.

✅ Test Information
• Test Name: ${mockAttempt.testName}
• Date Taken: ${dateStr}
• Score: ${mockAttempt.score} out of ${mockAttempt.maxScore}

📊 View Detailed Report
${resultUrl}

💡 The report includes section-by-section scores and learning guidance.

⏰ Link expires in 30 days
❓ Questions? Contact your teacher

Thank you! 🙏`;
      }
    }
  };

  const generateBulkTemplate = () => {
    const messages = selectedStudents.map(student => 
      generateTemplate(student, selectedPlatform, selectedLanguage)
    );
    
    return messages.join('\n\n--- 다음 학생 ---\n\n');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value as 'sms' | 'kakao');
  };

  const templates = {
    individual: selectedStudents.map(student => ({
      student,
      message: generateTemplate(student, selectedPlatform, selectedLanguage)
    })),
    bulk: generateBulkTemplate()
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            메시지 템플릿 생성
          </DialogTitle>
          <DialogDescription>
            선택된 {selectedStudents.length}명의 학생에 대한 결과 안내 메시지를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform & Language Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">플랫폼</Label>
              <Tabs value={selectedPlatform} onValueChange={handlePlatformChange} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="kakao">카카오톡</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="text-sm font-medium">언어</Label>
              <Tabs value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as 'ko' | 'en')} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ko">한국어</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Template Selection */}
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                개별 템플릿
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                일괄 템플릿
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                각 학생별로 개별 메시지를 생성합니다. 학생별로 복사하여 사용하세요.
              </p>
              
              <div className="grid gap-4">
                {templates.individual.map(({ student, message }, index) => (
                  <Card key={student.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {student.name}
                          <Badge variant="outline">{student.educationSystem}</Badge>
                          <Badge variant="outline">{student.grade}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(message)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          복사
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={message}
                        readOnly
                        className="min-h-[200px] text-sm"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  전체 학생의 메시지를 하나로 합쳐서 생성합니다.
                </p>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(templates.bulk)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  전체 복사
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    일괄 메시지 템플릿
                    <Badge variant="secondary" className="ml-2">
                      {selectedStudents.length}명
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    학생별 구분선이 포함된 통합 메시지입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={templates.bulk}
                    readOnly
                    className="min-h-[400px] text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Usage Instructions */}
          <Card className="bg-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">사용 안내</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 생성된 템플릿을 복사하여 SMS 발송 도구나 카카오톡 비즈니스에서 사용하세요.</p>
              <p>• 실제 발송 전에 결과 링크가 정상 작동하는지 확인해주세요.</p>
              <p>• 개인정보 보호를 위해 결과 링크의 유효기간을 적절히 설정해주세요.</p>
              <p>• 메시지 내용은 필요에 따라 수정하여 사용하실 수 있습니다.</p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}