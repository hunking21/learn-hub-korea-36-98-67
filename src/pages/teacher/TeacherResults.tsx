import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  Search, 
  Eye, 
  Download, 
  Filter,
  Calendar,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  FileText,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  id: string;
  studentName: string;
  studentId: string;
  studentGrade: string;
  testTitle: string;
  testType: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  timeSpent: number; // 분
  correctAnswers: number;
  totalQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  categories: {
    name: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
}

const mockResults: TestResult[] = [
  {
    id: '1',
    studentName: '김학생',
    studentId: '1',
    studentGrade: '고3',
    testTitle: '수능 독해 모의고사 1회',
    testType: '독해',
    score: 88,
    maxScore: 100,
    percentage: 88,
    completedAt: '2024-03-14',
    timeSpent: 65,
    correctAnswers: 22,
    totalQuestions: 25,
    difficulty: 'Hard',
    categories: [
      { name: '주제 추론', correct: 4, total: 5, percentage: 80 },
      { name: '세부 정보', correct: 5, total: 5, percentage: 100 },
      { name: '어휘 추측', correct: 3, total: 5, percentage: 60 },
      { name: '빈칸 추론', correct: 4, total: 5, percentage: 80 },
      { name: '문장 삽입', correct: 6, total: 5, percentage: 80 }
    ]
  },
  {
    id: '2',
    studentName: '이영희',
    studentId: '2',
    studentGrade: '중3',
    testTitle: '중3 독해력 평가',
    testType: '독해',
    score: 76,
    maxScore: 100,
    percentage: 76,
    completedAt: '2024-03-13',
    timeSpent: 45,
    correctAnswers: 15,
    totalQuestions: 20,
    difficulty: 'Medium',
    categories: [
      { name: '주제 추론', correct: 3, total: 4, percentage: 75 },
      { name: '세부 정보', correct: 4, total: 4, percentage: 100 },
      { name: '어휘 추측', correct: 2, total: 4, percentage: 50 },
      { name: '빈칸 추론', correct: 3, total: 4, percentage: 75 },
      { name: '문장 삽입', correct: 3, total: 4, percentage: 75 }
    ]
  },
  {
    id: '3',
    studentName: '박철수',
    studentId: '3',
    studentGrade: '고2',
    testTitle: '고2 어휘력 테스트',
    testType: '어휘',
    score: 92,
    maxScore: 100,
    percentage: 92,
    completedAt: '2024-03-12',
    timeSpent: 30,
    correctAnswers: 23,
    totalQuestions: 25,
    difficulty: 'Medium',
    categories: [
      { name: '동의어', correct: 5, total: 5, percentage: 100 },
      { name: '반의어', correct: 4, total: 5, percentage: 80 },
      { name: '문맥 추론', correct: 5, total: 5, percentage: 100 },
      { name: '숙어', correct: 4, total: 5, percentage: 80 },
      { name: '파생어', correct: 5, total: 5, percentage: 100 }
    ]
  },
  {
    id: '4',
    studentName: '최민수',
    studentId: '4',
    studentGrade: '중2',
    testTitle: '중2 기초 독해',
    testType: '독해',
    score: 72,
    maxScore: 100,
    percentage: 72,
    completedAt: '2024-03-11',
    timeSpent: 40,
    correctAnswers: 14,
    totalQuestions: 20,
    difficulty: 'Easy',
    categories: [
      { name: '주제 추론', correct: 2, total: 4, percentage: 50 },
      { name: '세부 정보', correct: 4, total: 4, percentage: 100 },
      { name: '어휘 추측', correct: 3, total: 4, percentage: 75 },
      { name: '빈칸 추론', correct: 2, total: 4, percentage: 50 },
      { name: '문장 삽입', correct: 3, total: 4, percentage: 75 }
    ]
  },
  {
    id: '5',
    studentName: '정하나',
    studentId: '5',
    studentGrade: '고1',
    testTitle: '고1 독해 실력 측정',
    testType: '독해',
    score: 85,
    maxScore: 100,
    percentage: 85,
    completedAt: '2024-03-10',
    timeSpent: 50,
    correctAnswers: 17,
    totalQuestions: 20,
    difficulty: 'Medium',
    categories: [
      { name: '주제 추론', correct: 4, total: 4, percentage: 100 },
      { name: '세부 정보', correct: 4, total: 4, percentage: 100 },
      { name: '어휘 추측', correct: 2, total: 4, percentage: 50 },
      { name: '빈칸 추론', correct: 3, total: 4, percentage: 75 },
      { name: '문장 삽입', correct: 4, total: 4, percentage: 100 }
    ]
  }
];

// 차트 데이터
const scoreDistribution = [
  { range: '0-60', count: 1, color: '#ef4444' },
  { range: '61-70', count: 0, color: '#f97316' },
  { range: '71-80', count: 2, color: '#eab308' },
  { range: '81-90', count: 2, color: '#22c55e' },
  { range: '91-100', count: 1, color: '#3b82f6' }
];

const weeklyProgress = [
  { week: '1주차', avgScore: 74, testCount: 12 },
  { week: '2주차', avgScore: 78, testCount: 15 },
  { week: '3주차', avgScore: 82, testCount: 18 },
  { week: '4주차', avgScore: 85, testCount: 16 }
];

export default function TeacherResults() {
  const [results, setResults] = useState<TestResult[]>(mockResults);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [dateRange, setDateRange] = useState("week");
  const { toast } = useToast();

  const filteredResults = results.filter(result => {
    const matchesSearch = result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.testTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === "all" || result.studentGrade === filterGrade;
    const matchesType = filterType === "all" || result.testType === filterType;
    const matchesDifficulty = filterDifficulty === "all" || result.difficulty === filterDifficulty;
    
    return matchesSearch && matchesGrade && matchesType && matchesDifficulty;
  });

  const handleViewResult = (result: TestResult) => {
    setSelectedResult(result);
  };

  const handleDownloadReport = () => {
    toast({
      title: "리포트 다운로드",
      description: "성적 리포트가 다운로드되었습니다.",
    });
  };

  const handleSendFeedback = (resultId: string) => {
    toast({
      title: "피드백 발송",
      description: "학생에게 피드백이 발송되었습니다.",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-blue-600';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 통계 계산
  const totalResults = results.length;
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length);
  const highScores = results.filter(r => r.percentage >= 80).length;
  const avgTime = Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">테스트 결과</h1>
            <p className="text-muted-foreground">학생들의 시험 결과를 분석하고 관리합니다</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="mr-2 h-4 w-4" />
              리포트 다운로드
            </Button>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 시험 결과</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResults}개</div>
              <p className="text-xs text-muted-foreground">
                이번 주 신규 {Math.floor(totalResults * 0.3)}개
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore}점</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                전주 대비 +3점
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">우수 성과</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highScores}개</div>
              <p className="text-xs text-muted-foreground">
                80점 이상 ({Math.round((highScores / totalResults) * 100)}%)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 소요 시간</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgTime}분</div>
              <p className="text-xs text-muted-foreground">
                권장 시간 대비 적정
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 주간 성과 차트 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>주간 성과 추이</CardTitle>
              <CardDescription>주간별 평균 점수와 시험 수 변화</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avgScore" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="평균 점수" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="testCount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="시험 수" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 점수 분포 */}
          <Card>
            <CardHeader>
              <CardTitle>점수 분포</CardTitle>
              <CardDescription>점수대별 학생 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, count }) => `${range}: ${count}명`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 결과 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>시험 결과 목록</CardTitle>
            <CardDescription>학생들의 시험 결과를 자세히 확인할 수 있습니다</CardDescription>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="학생명 또는 시험명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 학년</SelectItem>
                  <SelectItem value="중1">중1</SelectItem>
                  <SelectItem value="중2">중2</SelectItem>
                  <SelectItem value="중3">중3</SelectItem>
                  <SelectItem value="고1">고1</SelectItem>
                  <SelectItem value="고2">고2</SelectItem>
                  <SelectItem value="고3">고3</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  <SelectItem value="독해">독해</SelectItem>
                  <SelectItem value="어휘">어휘</SelectItem>
                  <SelectItem value="문법">문법</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 난이도</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생</TableHead>
                  <TableHead>시험명</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>점수</TableHead>
                  <TableHead>정답률</TableHead>
                  <TableHead>소요시간</TableHead>
                  <TableHead>난이도</TableHead>
                  <TableHead>완료일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{result.studentName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{result.studentName}</div>
                          <div className="text-sm text-muted-foreground">{result.studentGrade}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        <div className="font-medium truncate">{result.testTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.totalQuestions}문항
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{result.testType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`font-bold ${getScoreColor(result.percentage)}`}>
                        {result.score}점
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ({result.percentage}%)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={(result.correctAnswers / result.totalQuestions) * 100} className="w-16 h-2" />
                        <span className="text-sm">
                          {result.correctAnswers}/{result.totalQuestions}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{result.timeSpent}분</TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(result.difficulty)}>
                        {result.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.completedAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewResult(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSendFeedback(result.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 결과 상세 다이얼로그 */}
        <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{selectedResult?.studentName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl">{selectedResult?.studentName}</div>
                    <div className="text-muted-foreground">{selectedResult?.testTitle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(selectedResult?.percentage || 0)}`}>
                    {selectedResult?.score}점
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedResult?.percentage}%
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedResult && (
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">개요</TabsTrigger>
                  <TabsTrigger value="details">상세 분석</TabsTrigger>
                  <TabsTrigger value="feedback">피드백</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">시험 정보</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>시험 유형:</span>
                          <Badge variant="outline">{selectedResult.testType}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>난이도:</span>
                          <Badge className={getDifficultyColor(selectedResult.difficulty)}>
                            {selectedResult.difficulty}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>완료일:</span>
                          <span>{selectedResult.completedAt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>소요시간:</span>
                          <span>{selectedResult.timeSpent}분</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">성과 요약</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>총 문항 수:</span>
                          <span className="font-medium">{selectedResult.totalQuestions}문항</span>
                        </div>
                        <div className="flex justify-between">
                          <span>정답 수:</span>
                          <span className="font-medium">{selectedResult.correctAnswers}문항</span>
                        </div>
                        <div className="flex justify-between">
                          <span>정답률:</span>
                          <span className="font-medium">
                            {Math.round((selectedResult.correctAnswers / selectedResult.totalQuestions) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>취득 점수:</span>
                          <span className={`font-bold ${getScoreColor(selectedResult.percentage)}`}>
                            {selectedResult.score}/{selectedResult.maxScore}점
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">영역별 성과 분석</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedResult.categories.map((category, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{category.name}</span>
                              <div className="text-right">
                                <span className="font-medium">{category.correct}/{category.total}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({category.percentage}%)
                                </span>
                              </div>
                            </div>
                            <Progress value={category.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">성과 차트</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={selectedResult.categories}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="percentage" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="feedback" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">학습 피드백</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">잘한 점</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            {selectedResult.categories
                              .filter(cat => cat.percentage >= 80)
                              .map((cat, index) => (
                                <li key={index}>• {cat.name} 영역에서 우수한 성과 ({cat.percentage}%)</li>
                              ))
                            }
                            {selectedResult.timeSpent <= 60 && (
                              <li>• 적절한 시간 내에 시험을 완료함</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <h4 className="font-medium text-orange-800 mb-2">개선이 필요한 점</h4>
                          <ul className="text-sm text-orange-700 space-y-1">
                            {selectedResult.categories
                              .filter(cat => cat.percentage < 70)
                              .map((cat, index) => (
                                <li key={index}>• {cat.name} 영역 집중 학습 필요 ({cat.percentage}%)</li>
                              ))
                            }
                            {selectedResult.timeSpent > 70 && (
                              <li>• 시간 관리 능력 향상 필요</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">학습 권장사항</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• 약점 영역에 대한 추가 연습 문제 풀이</li>
                            <li>• 정기적인 복습을 통한 개념 정리</li>
                            <li>• 유사 문제 반복 학습으로 정확도 향상</li>
                            {selectedResult.percentage < 70 && (
                              <li>• 기초 개념 재학습 권장</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}