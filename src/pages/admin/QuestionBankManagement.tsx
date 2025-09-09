import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuestionBank } from "@/hooks/useQuestionBank";
import { QuestionBankFilters } from "@/components/admin/QuestionBankFilters";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { AddToSectionModal } from "@/components/admin/AddToSectionModal";
import { SpeakingQuestionGeneratorModal } from "@/components/admin/SpeakingQuestionGeneratorModal";
import {
  Plus,
  Search,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  FileDown,
  FileUp,
  Database,
  CheckSquare,
  Square,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function QuestionBankManagement() {
  const {
    questions,
    allQuestions,
    filters,
    setFilters,
    isLoading,
    selectedQuestions,
    allTags,
    allCategories,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    exportQuestions,
    importQuestions,
    addQuestionsToSection,
    toggleQuestionSelection,
    selectAllVisible,
    clearSelection,
  } = useQuestionBank();

  const [showAddToSectionModal, setShowAddToSectionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importQuestions(file);
      event.target.value = '';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = { MCQ: '객관식', Short: '주관식', Speaking: '말하기' };
    return labels[type as keyof typeof labels] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[difficulty as keyof typeof colors] || '';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels = { Easy: '쉬움', Medium: '보통', Hard: '어려움' };
    return labels[difficulty as keyof typeof labels] || difficulty;
  };

  const isAllVisibleSelected = questions.length > 0 && questions.every(q => selectedQuestions.includes(q.id));
  const isSomeSelected = selectedQuestions.length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">문제은행 관리</h1>
            <p className="text-muted-foreground mt-2">
              중앙 문제은행에서 문항을 생성, 검색하고 시험에 추가할 수 있습니다
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 통계 */}
            <Badge variant="outline" className="text-sm">
              <Database className="w-4 h-4 mr-1" />
              총 {allQuestions.length}개 문항
            </Badge>
            
            {/* 내보내기 */}
            <Button variant="outline" onClick={exportQuestions}>
              <FileDown className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            
            {/* 가져오기 */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                <FileUp className="w-4 h-4 mr-2" />
                가져오기
              </Button>
            </div>
            
            {/* 스피킹 질문 자동 생성 */}
            <SpeakingQuestionGeneratorModal
              onGenerate={async (questions) => {
                for (const question of questions) {
                  await addQuestion(question);
                }
              }}
            />
            
            {/* 새 문항 추가 */}
            <QuestionForm onSubmit={addQuestion} />
          </div>
        </div>

        {/* 필터 */}
        <QuestionBankFilters
          filters={filters}
          onFiltersChange={setFilters}
          allTags={allTags}
          allCategories={allCategories}
        />

        {/* 메인 콘텐츠 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                문항 목록
                <Badge className="ml-2">{questions.length}</Badge>
              </CardTitle>
              
              {/* 일괄 작업 */}
              {isSomeSelected && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedQuestions.length}개 선택됨
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowAddToSectionModal(true)}
                    disabled={selectedQuestions.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    섹션에 추가
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    선택 해제
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground">문항을 불러오는 중...</p>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {allQuestions.length === 0 
                    ? '아직 등록된 문항이 없습니다' 
                    : '검색 조건에 맞는 문항이 없습니다'}
                </p>
                {allQuestions.length === 0 && (
                  <QuestionForm 
                    onSubmit={addQuestion}
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        첫 번째 문항 추가
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 일괄 선택 헤더 */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllVisibleSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllVisible();
                        } else {
                          clearSelection();
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isAllVisibleSelected ? '모든 문항 선택됨' : '모든 문항 선택'}
                    </span>
                  </div>
                </div>
                
                <Separator />

                {/* 문항 테이블 */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllVisibleSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllVisible();
                            } else {
                              clearSelection();
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>문항 내용</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>난이도</TableHead>
                      <TableHead>점수</TableHead>
                      <TableHead>태그</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <TableRow
                        key={question.id}
                        className={selectedQuestions.includes(question.id) ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedQuestions.includes(question.id)}
                            onCheckedChange={() => toggleQuestionSelection(question.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium line-clamp-2">{question.prompt}</p>
                            {question.category && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {question.category}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getTypeLabel(question.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {getDifficultyLabel(question.difficulty)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{question.points}점</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-32">
                            {question.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {question.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{question.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(question.createdAt), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border">
                              <DropdownMenuItem onClick={() => setEditingQuestion(question)}>
                                <Edit className="w-4 h-4 mr-2" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteQuestion(question.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 수정 모달 */}
        {editingQuestion && (
          <QuestionForm
            question={editingQuestion}
            onSubmit={(data) => updateQuestion(editingQuestion.id, data)}
            onClose={() => setEditingQuestion(null)}
            trigger={<div />}
          />
        )}

        {/* 섹션 추가 모달 */}
        <AddToSectionModal
          isOpen={showAddToSectionModal}
          onClose={() => setShowAddToSectionModal(false)}
          selectedQuestionIds={selectedQuestions}
          onAddToSection={addQuestionsToSection}
        />
      </div>
    </AdminLayout>
  );
}