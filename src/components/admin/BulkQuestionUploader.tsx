import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, Download, Eye, AlertTriangle, CheckCircle, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { memoryRepo } from "@/repositories/memoryRepo";
import type { Test, Version, Section, QuestionType } from "@/types/schema";

interface BulkQuestionUploaderProps {
  test: Test;
  selectedVersion: Version;
  onQuestionsUpdated: () => void;
}

interface ParsedQuestion {
  row: number;
  section: string;
  type: QuestionType;
  prompt: string;
  choices: string[];
  answer: number | string;
  points: number;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passage?: string;
  errors: string[];
}

interface UploadResult {
  success: number;
  failed: number;
  failedRows: { row: number; errors: string[] }[];
}

const TEMPLATE_HEADERS = [
  'section', 'type', 'prompt', 'choice1', 'choice2', 'choice3', 'choice4', 
  'choice5', 'choice6', 'choice7', 'choice8', 'choices', 'answer', 
  'points', 'tags', 'difficulty', 'passage'
];

const QUESTION_TYPES: QuestionType[] = ['MCQ', 'Short', 'Speaking', 'Writing', 'Instruction', 'Passage'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export function BulkQuestionUploader({ test, selectedVersion, onQuestionsUpdated }: BulkQuestionUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateSections, setShowCreateSections] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csvContent = [
      TEMPLATE_HEADERS.join(','),
      'Reading,MCQ,"다음 문장에서 가장 적절한 답은?",선택지1,선택지2,선택지3,선택지4,,,,,,,1,2,"grammar,reading",Medium,passage1',
      'Writing,Short,"다음 단어의 과거형을 쓰시오: go",,,,,,,,"went|/went/",2,"vocabulary,writing",Easy,',
      'Speaking,Speaking,"자기소개를 1분간 해보세요.",,,,,,,,,5,"speaking,introduction",Medium,',
      'Math,MCQ,"2 + 2 = ?",2,3,4,5,,,,,1,1,"math,basic",Easy,'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'question-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "템플릿 다운로드",
      description: "템플릿 파일이 다운로드되었습니다.",
    });
  };

  const exportExistingQuestions = () => {
    const allQuestions: any[] = [];
    
    selectedVersion.sections?.forEach(section => {
      section.questions?.forEach(question => {
        const choices = question.choices || [];
        const row: any = {
          section: section.label,
          type: question.type,
          prompt: question.prompt || '',
          choice1: choices[0] || '',
          choice2: choices[1] || '',
          choice3: choices[2] || '',
          choice4: choices[3] || '',
          choice5: choices[4] || '',
          choice6: choices[5] || '',
          choice7: choices[6] || '',
          choice8: choices[7] || '',
          choices: '',
          answer: question.type === 'MCQ' 
            ? (typeof question.answer === 'number' ? question.answer + 1 : question.answer)
            : question.type === 'Short' && typeof question.answer === 'string' && question.answer.startsWith('/') && question.answer.endsWith('/')
              ? question.answer
              : question.answer,
          points: question.points,
          tags: '', // 기존 question에 tags가 없음
          difficulty: 'Medium', // 기본값
          passage: question.passageId || ''
        };
        allQuestions.push(row);
      });
    });

    if (allQuestions.length === 0) {
      toast({
        title: "내보낼 문항 없음",
        description: "현재 버전에 문항이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = TEMPLATE_HEADERS.join(',');
    const csvRows = allQuestions.map(q => 
      TEMPLATE_HEADERS.map(header => {
        const value = q[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `questions-${test.name}-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "내보내기 완료",
      description: `${allQuestions.length}개 문항이 내보내기되었습니다.`,
    });
  };

  const parseCSV = (text: string): ParsedQuestion[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const question = parseQuestionRow(headers, values, i + 1);
      questions.push(question);
    }

    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseQuestionRow = (headers: string[], values: string[], rowNumber: number): ParsedQuestion => {
    const errors: string[] = [];
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // 필수 필드 검증
    if (!row.section?.trim()) errors.push('섹션이 필요합니다');
    if (!row.type?.trim()) errors.push('문항 타입이 필요합니다');
    if (!row.prompt?.trim()) errors.push('문제가 필요합니다');
    if (!row.points || isNaN(Number(row.points)) || Number(row.points) <= 0) {
      errors.push('점수는 양수여야 합니다');
    }

    // 타입 검증
    if (row.type && !QUESTION_TYPES.includes(row.type as QuestionType)) {
      errors.push(`유효하지 않은 문항 타입: ${row.type}`);
    }

    // 난이도 검증
    if (row.difficulty && !DIFFICULTIES.includes(row.difficulty)) {
      errors.push(`유효하지 않은 난이도: ${row.difficulty}`);
    }

    // 선택지 파싱
    let choices: string[] = [];
    if (row.choices) {
      choices = row.choices.split('|').filter((c: string) => c.trim());
    } else {
      // choice1~choice8에서 추출
      for (let i = 1; i <= 8; i++) {
        const choice = row[`choice${i}`];
        if (choice?.trim()) {
          choices.push(choice.trim());
        }
      }
    }

    // MCQ 답안 검증
    let answer: number | string = row.answer || '';
    if (row.type === 'MCQ') {
      const answerNum = Number(answer);
      if (isNaN(answerNum) || answerNum < 1 || answerNum > choices.length) {
        errors.push(`MCQ 답안은 1~${choices.length} 사이여야 합니다`);
      } else {
        answer = answerNum - 1; // 0-based 인덱스로 변환
      }
    }

    // 태그 파싱
    const tags = row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

    return {
      row: rowNumber,
      section: row.section?.trim() || '',
      type: row.type as QuestionType,
      prompt: row.prompt?.trim() || '',
      choices,
      answer,
      points: Number(row.points) || 1,
      tags,
      difficulty: row.difficulty || 'Medium',
      passage: row.passage?.trim() || undefined,
      errors
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "파일 형식 오류",
        description: "CSV 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const questions = parseCSV(text);
      setParsedQuestions(questions);
      
      // 존재하지 않는 섹션 확인
      const existingSections = selectedVersion.sections?.map(s => s.label) || [];
      const questionSections = [...new Set(questions.map(q => q.section).filter(Boolean))];
      const missing = questionSections.filter(section => !existingSections.includes(section));
      setMissingSections(missing);
      
      if (missing.length > 0) {
        setShowCreateSections(true);
      } else {
        setShowPreview(true);
      }
    };
    
    reader.readAsText(selectedFile, 'utf-8');
  };

  const handleCreateSections = async () => {
    try {
      for (const sectionLabel of missingSections) {
        await memoryRepo.addSection(test.id, selectedVersion.id, {
          label: sectionLabel,
          type: 'Custom',
          timeLimit: 30,
          settings: {}
        });
      }
      
      toast({
        title: "섹션 생성 완료",
        description: `${missingSections.length}개 섹션이 생성되었습니다.`,
      });
      
      setShowCreateSections(false);
      setShowPreview(true);
      onQuestionsUpdated(); // 섹션 업데이트 반영
    } catch (error) {
      console.error('섹션 생성 실패:', error);
      toast({
        title: "오류",
        description: "섹션 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!parsedQuestions.length) return;

    setIsUploading(true);
    const result: UploadResult = { success: 0, failed: 0, failedRows: [] };

    try {
      const sectionMap = new Map<string, Section>();
      selectedVersion.sections?.forEach(section => {
        sectionMap.set(section.label, section);
      });

      for (const question of parsedQuestions) {
        if (question.errors.length > 0) {
          result.failed++;
          result.failedRows.push({ row: question.row, errors: question.errors });
          continue;
        }

        const section = sectionMap.get(question.section);
        if (!section) {
          result.failed++;
          result.failedRows.push({ row: question.row, errors: [`섹션을 찾을 수 없음: ${question.section}`] });
          continue;
        }

        try {
          const success = await memoryRepo.addQuestion(test.id, selectedVersion.id, section.id, {
            type: question.type,
            prompt: question.prompt,
            choices: question.choices.length > 0 ? question.choices : undefined,
            answer: question.answer,
            points: question.points,
            passageId: question.passage
          });

          if (success) {
            result.success++;
          } else {
            result.failed++;
            result.failedRows.push({ row: question.row, errors: ['문항 저장 실패'] });
          }
        } catch (error) {
          result.failed++;
          result.failedRows.push({ row: question.row, errors: ['문항 저장 중 오류 발생'] });
        }
      }

      setUploadResult(result);
      setShowPreview(false);
      onQuestionsUpdated();
      
      toast({
        title: "업로드 완료",
        description: `성공: ${result.success}건, 실패: ${result.failed}건`,
        variant: result.failed > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error('업로드 실패:', error);
      toast({
        title: "오류",
        description: "업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploader = () => {
    setFile(null);
    setParsedQuestions([]);
    setUploadResult(null);
    setShowPreview(false);
    setShowCreateSections(false);
    setMissingSections([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validQuestions = parsedQuestions.filter(q => q.errors.length === 0);
  const invalidQuestions = parsedQuestions.filter(q => q.errors.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            문항 일괄 업로드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              템플릿 다운로드
            </Button>
            <Button variant="outline" onClick={exportExistingQuestions}>
              <Download className="h-4 w-4 mr-2" />
              내보내기 (CSV)
            </Button>
          </div>

          <div>
            <Label htmlFor="csv-file">CSV 파일 선택</Label>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{file.name}</span>
              <Badge variant="secondary">{parsedQuestions.length}개 문항</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 섹션 생성 확인 대화상자 */}
      <AlertDialog open={showCreateSections} onOpenChange={setShowCreateSections}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              새 섹션 생성
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>다음 섹션들이 존재하지 않습니다. 새로 생성하시겠습니까?</p>
                <ul className="mt-2 space-y-1">
                  {missingSections.map(section => (
                    <li key={section} className="flex items-center gap-2">
                      <Badge variant="outline">{section}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCreateSections(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateSections}>
              섹션 생성
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 미리보기 */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              업로드 미리보기
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                유효: {validQuestions.length}건
              </Badge>
              {invalidQuestions.length > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  오류: {invalidQuestions.length}건
                </Badge>
              )}
            </div>

            {invalidQuestions.length > 0 && (
              <div className="border border-destructive/20 rounded-lg p-3">
                <h4 className="font-medium text-destructive mb-2">오류가 있는 문항들:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {invalidQuestions.slice(0, 10).map(q => (
                    <div key={q.row} className="text-sm">
                      <span className="font-medium">행 {q.row}:</span> {q.errors.join(', ')}
                    </div>
                  ))}
                  {invalidQuestions.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      외 {invalidQuestions.length - 10}건의 오류...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={validQuestions.length === 0 || isUploading}
                className="flex-1"
              >
                {isUploading ? '업로드 중...' : `${validQuestions.length}건 업로드`}
              </Button>
              <Button variant="outline" onClick={resetUploader}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 업로드 결과 */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              업로드 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                성공: {uploadResult.success}건
              </Badge>
              {uploadResult.failed > 0 && (
                <Badge variant="destructive">
                  실패: {uploadResult.failed}건
                </Badge>
              )}
            </div>

            {uploadResult.failedRows.length > 0 && (
              <div className="border border-destructive/20 rounded-lg p-3">
                <h4 className="font-medium text-destructive mb-2">실패한 문항들:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadResult.failedRows.map(({ row, errors }) => (
                    <div key={row} className="text-sm">
                      <span className="font-medium">행 {row}:</span> {errors.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={resetUploader} variant="outline" className="w-full">
              새 파일 업로드
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}