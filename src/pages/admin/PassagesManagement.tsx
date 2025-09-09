import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Eye, Search, BookOpen, Users, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useReadingPassages, 
  useCreateReadingPassage, 
  useUpdateReadingPassage, 
  useDeleteReadingPassage,
  ReadingPassage 
} from "@/hooks/useReadingPassages";
import { useTestSessionsByPassage } from "@/hooks/useTestSessions";
import { QuestionsDialog } from "@/components/admin/QuestionsDialog";

export default function PassagesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPassage, setEditingPassage] = useState<ReadingPassage | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);
  const [questionsPassage, setQuestionsPassage] = useState<ReadingPassage | null>(null);
  const { toast } = useToast();

  const { data: passages = [], isLoading, refetch } = useReadingPassages({ grade: selectedGrade || undefined });
  const createPassage = useCreateReadingPassage();
  const updatePassage = useUpdateReadingPassage();
  const deletePassage = useDeleteReadingPassage();
  
  const { data: sessionData = [] } = useTestSessionsByPassage(selectedPassage?.id || "");

  const filteredPassages = passages.filter(passage =>
    passage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passage.grade_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePassage = () => {
    setEditingPassage(null);
    setIsDialogOpen(true);
  };

  const handleEditPassage = (passage: ReadingPassage) => {
    setEditingPassage(passage);
    setIsDialogOpen(true);
  };

  const handleViewPassage = (passage: ReadingPassage) => {
    setSelectedPassage(passage);
  };

  const handleManageQuestions = (passage: ReadingPassage) => {
    setQuestionsPassage(passage);
    setIsQuestionsDialogOpen(true);
  };

  const handleDeletePassage = async (passageId: string) => {
    try {
      await deletePassage.mutateAsync(passageId);
      toast({
        title: "지문 삭제 완료",
        description: "지문이 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "지문 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleSavePassage = async (formData: FormData) => {
    const passageData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      grade_level: formData.get('grade_level') as string,
      difficulty_level: parseInt(formData.get('difficulty_level') as string),
    };

    try {
      if (editingPassage) {
        await updatePassage.mutateAsync({ id: editingPassage.id, ...passageData });
        toast({
          title: "지문 수정 완료",
          description: "지문이 성공적으로 수정되었습니다.",
        });
      } else {
        await createPassage.mutateAsync(passageData);
        toast({
          title: "지문 생성 완료",
          description: "새 지문이 성공적으로 생성되었습니다.",
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "지문 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 1) return 'bg-green-500';
    if (level <= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyText = (level: number) => {
    if (level <= 1) return '쉬움';
    if (level <= 2) return '보통';
    return '어려움';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">지문 관리</h1>
            <p className="text-muted-foreground">독해 지문을 관리합니다</p>
          </div>
          <Button onClick={handleCreatePassage}>
            <Plus className="mr-2 h-4 w-4" />
            새 지문 추가
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 지문</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">문제 보유 지문</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {passages.filter(p => (p.question_count || 0) > 0).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 문제 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {passages.length > 0 ? Math.round(passages.reduce((acc, p) => acc + (p.question_count || 0), 0) / passages.length) : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">학습자 수</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedPassage ? sessionData.length : '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>지문 목록</CardTitle>
            <CardDescription>
              등록된 모든 지문을 관리할 수 있습니다
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="지문 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="학년 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체 학년</SelectItem>
                  <SelectItem value="중1">중학교 1학년</SelectItem>
                  <SelectItem value="중2">중학교 2학년</SelectItem>
                  <SelectItem value="중3">중학교 3학년</SelectItem>
                  <SelectItem value="고1">고등학교 1학년</SelectItem>
                  <SelectItem value="고2">고등학교 2학년</SelectItem>
                  <SelectItem value="고3">고등학교 3학년</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>학년</TableHead>
                  <TableHead>내용 미리보기</TableHead>
                  <TableHead>문제 수</TableHead>
                  <TableHead>난이도</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : filteredPassages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      지문이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPassages.map((passage) => (
                    <TableRow key={passage.id}>
                      <TableCell>
                        <div className="font-medium">{passage.title}</div>
                      </TableCell>
                      <TableCell>{passage.grade_level}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {passage.content.substring(0, 50)}...
                        </div>
                      </TableCell>
                      <TableCell>{passage.question_count || 0}개</TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(passage.difficulty_level)}>
                          {getDifficultyText(passage.difficulty_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(passage.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewPassage(passage)}
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleManageQuestions(passage)}
                            title="문제 관리"
                          >
                            <FileQuestion className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPassage(passage)}
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePassage(passage.id)}
                            disabled={deletePassage.isPending}
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 지문 작성/수정 대화상자 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPassage ? '지문 수정' : '새 지문 추가'}
              </DialogTitle>
              <DialogDescription>
                지문의 내용과 정보를 입력하세요
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSavePassage(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">지문 제목</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingPassage?.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade_level">학년</Label>
                  <Select name="grade_level" defaultValue={editingPassage?.grade_level}>
                    <SelectTrigger>
                      <SelectValue placeholder="학년 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="중1">중학교 1학년</SelectItem>
                      <SelectItem value="중2">중학교 2학년</SelectItem>
                      <SelectItem value="중3">중학교 3학년</SelectItem>
                      <SelectItem value="고1">고등학교 1학년</SelectItem>
                      <SelectItem value="고2">고등학교 2학년</SelectItem>
                      <SelectItem value="고3">고등학교 3학년</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty_level">난이도</Label>
                <Select name="difficulty_level" defaultValue={editingPassage?.difficulty_level?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">쉬움 (1)</SelectItem>
                    <SelectItem value="2">보통 (2)</SelectItem>
                    <SelectItem value="3">어려움 (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">지문 내용</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editingPassage?.content}
                  rows={12}
                  placeholder="지문 내용을 입력하세요..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  {editingPassage ? '수정' : '추가'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* 지문 보기 대화상자 */}
        <Dialog open={!!selectedPassage} onOpenChange={() => setSelectedPassage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPassage?.title}</DialogTitle>
              <div className="flex space-x-2">
                <Badge>{selectedPassage?.grade_level}</Badge>
                <Badge className={getDifficultyColor(selectedPassage?.difficulty_level || 1)}>
                  {getDifficultyText(selectedPassage?.difficulty_level || 1)}
                </Badge>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>문제 수: {selectedPassage?.question_count || 0}개</div>
                <div>생성일: {selectedPassage ? new Date(selectedPassage.created_at).toLocaleDateString() : ''}</div>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedPassage?.content}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 문제 관리 대화상자 */}
        {questionsPassage && (
          <QuestionsDialog
            open={isQuestionsDialogOpen}
            onOpenChange={setIsQuestionsDialogOpen}
            passageId={questionsPassage.id}
            passageTitle={questionsPassage.title}
          />
        )}
      </div>
    </AdminLayout>
  );
}