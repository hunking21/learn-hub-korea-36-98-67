import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Clock, 
  Trophy, 
  Download,
  Calendar,
  Filter,
  Trash2,
  FilePlus,
  Link2
} from 'lucide-react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { memoryRepo } from '@/repositories/memoryRepo';
import { localStore } from '@/store/localStore';
import type { Test, TestAttempt } from '@/types';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import { ResultTokenGenerator } from '@/components/admin/ResultTokenGenerator';
import { resultTokenManager, StudentTestAttempt } from '@/utils/resultTokenUtils';
import { RecentChanges } from '@/components/admin/RecentChanges';
import { seedDemoChangelogData } from '@/utils/demoChangelogData';

interface DashboardStats {
  totalTests: number;
  publishedTests: number;
  totalAssignments: number;
  inProgressAttempts: number;
  submittedAttempts: number;
  averageFinalScore: number;
}

interface AttemptWithInfo extends TestAttempt {
  testName: string;
  system: string;
  grade: string;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    publishedTests: 0,
    totalAssignments: 0,
    inProgressAttempts: 0,
    submittedAttempts: 0,
    averageFinalScore: 0,
  });
  
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<AttemptWithInfo[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<AttemptWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedTestId, setSelectedTestId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Result token modal
  const [isResultTokenModalOpen, setIsResultTokenModalOpen] = useState(false);
  const [selectedAttemptForToken, setSelectedAttemptForToken] = useState<AttemptWithInfo | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Initialize demo changelog data on first visit
    seedDemoChangelogData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attempts, selectedTestId, startDate, endDate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load tests
      const testData = await memoryRepo.listTests();
      setTests(testData);
      
      // Load all attempts
      const allAttempts = await memoryRepo.getAllAttempts();
      
      // Transform attempts with test info
      const attemptsWithInfo: AttemptWithInfo[] = allAttempts.map(attempt => {
        const test = testData.find(t => t.id === attempt.testId);
        const version = test?.versions?.find(v => v.id === attempt.versionId);
        
        return {
          ...attempt,
          testName: test?.name || 'Unknown Test',
          system: version?.system || 'Unknown',
          grade: version?.grade || 'Unknown',
        };
      });
      
      setAttempts(attemptsWithInfo);
      
      // Calculate stats
      const totalAssignments = testData.reduce((sum, test) => 
        sum + (test.assignments?.length || 0), 0
      );
      
      const inProgress = allAttempts.filter(a => a.status === 'in_progress').length;
      const submitted = allAttempts.filter(a => a.status === 'submitted').length;
      
      const submittedWithScores = allAttempts.filter(a => 
        a.status === 'submitted' && a.finalTotal !== undefined && a.maxTotal
      );
      
      const avgScore = submittedWithScores.length > 0 
        ? submittedWithScores.reduce((sum, a) => sum + (a.finalTotal! / a.maxTotal! * 100), 0) / submittedWithScores.length
        : 0;
      
      setStats({
        totalTests: testData.length,
        publishedTests: testData.filter(t => t.status === 'Published').length,
        totalAssignments,
        inProgressAttempts: inProgress,
        submittedAttempts: submitted,
        averageFinalScore: Math.round(avgScore * 10) / 10,
      });
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attempts];
    
    // Test filter
    if (selectedTestId !== 'all') {
      filtered = filtered.filter(a => a.testId === selectedTestId);
    }
    
    // Date filters
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(a => new Date(a.startedAt) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59');
      filtered = filtered.filter(a => new Date(a.startedAt) <= end);
    }
    
    setFilteredAttempts(filtered);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('ko-KR');
  };

  const getStatusBadge = (status: string, reviewStatus?: string) => {
    if (status === 'in_progress') {
      return <Badge variant="secondary">진행중</Badge>;
    }
    if (status === 'submitted') {
      if (reviewStatus === 'completed') {
        return <Badge variant="default">완료</Badge>;
      }
      return <Badge variant="outline">제출됨</Badge>;
    }
    return <Badge variant="destructive">중단됨</Badge>;
  };

  const downloadCSV = () => {
    if (filteredAttempts.length === 0) {
      toast.error('다운로드할 데이터가 없습니다.');
      return;
    }

    const headers = [
      'AttemptID',
      'CandidateName',
      'CandidateSystem',
      'CandidateGrade',
      'CandidatePhone',
      'CandidateNote',
      'TestName',
      'System',
      'Grade',
      'Status',
      'ReviewStatus',
      'AutoScore',
      'HumanScore',
      'FinalScore',
      'MaxScore',
      'StartedAt',
      'SubmittedAt'
    ];

    const csvData = [
      headers.join(','),
      ...filteredAttempts.map(attempt => [
        attempt.id,
        attempt.candidate?.name || '',
        attempt.candidate?.system || '',
        attempt.candidate?.grade || '',
        attempt.candidate?.phone || '',
        attempt.candidate?.note || '',
        `"${attempt.testName}"`,
        attempt.system,
        attempt.grade,
        attempt.status,
        attempt.reviewStatus || '',
        attempt.autoTotal || 0,
        attempt.humanTotal || 0,
        attempt.finalTotal || 0,
        attempt.maxTotal || 0,
        `"${formatDate(attempt.startedAt)}"`,
        attempt.submittedAt ? `"${formatDate(attempt.submittedAt)}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `test_attempts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV 파일이 다운로드되었습니다.');
  };

  const handleDataClear = () => {
    localStore.clearAll();
    toast.success('모든 데이터가 초기화되었습니다.');
    loadDashboardData(); // 데이터 다시 로드
  };

  const handleGeneratePDF = async (attempt: AttemptWithInfo) => {
    try {
      const testData = tests.find(t => t.id === attempt.testId);
      const versionData = testData?.versions?.find(v => v.id === attempt.versionId);
      
      if (!testData || !versionData) {
        toast.error("시험 정보를 찾을 수 없습니다.");
        return;
      }

      toast.loading('PDF를 생성하고 있습니다...');

      await PDFGenerator.generateScoreReport({
        attempt,
        test: testData,
        version: versionData
      });

      toast.dismiss();
      toast.success('성적표 PDF가 다운로드되었습니다.');
    } catch (error) {
      toast.dismiss();
      toast.error('PDF 생성에 실패했습니다.');
      console.error('PDF generation failed:', error);
    }
  };

  const handleGenerateBulkPDF = async () => {
    if (filteredAttempts.length === 0) {
      toast.error('다운로드할 시도가 없습니다.');
      return;
    }

    try {
      toast.loading('일괄 PDF를 생성하고 있습니다...');
      
      const pdfOptions = filteredAttempts.map(attempt => {
        const testData = tests.find(t => t.id === attempt.testId);
        const versionData = testData?.versions?.find(v => v.id === attempt.versionId);
        
        if (!testData || !versionData) {
          throw new Error(`시험 정보를 찾을 수 없습니다: ${attempt.id}`);
        }

        return {
          attempt,
          test: testData,
          version: versionData
        };
      });

      await PDFGenerator.generateBulkPDFs(pdfOptions);

      toast.dismiss();
      toast.success(`${filteredAttempts.length}개의 성적표가 ZIP 파일로 다운로드되었습니다.`);
    } catch (error) {
      toast.dismiss();
      toast.error('일괄 PDF 생성에 실패했습니다.');
      console.error('Bulk PDF generation failed:', error);
    }
  };

  const handleOpenResultTokenModal = (attempt: AttemptWithInfo) => {
    if (attempt.status !== 'submitted') {
      toast.error('제출된 시험만 결과 링크를 생성할 수 있습니다.');
      return;
    }
    setSelectedAttemptForToken(attempt);
    setIsResultTokenModalOpen(true);
  };

  const convertToStudentTestAttempt = (attempt: AttemptWithInfo): StudentTestAttempt => {
    return {
      id: attempt.id,
      studentId: attempt.candidate?.name || 'unknown',
      studentName: attempt.candidate?.name || 'Unknown Student',
      testId: attempt.testId,
      testName: attempt.testName,
      completedAt: attempt.submittedAt || new Date().toISOString(),
      score: attempt.finalTotal || 0,
      maxScore: attempt.maxTotal || 100,
      percentage: attempt.maxTotal ? Math.round((attempt.finalTotal || 0) / attempt.maxTotal * 100) : 0,
      grade: 'N/A',
      resultToken: resultTokenManager.getAllAttempts().find(a => a.id === attempt.id)?.resultToken
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground mt-2">
              전체 시험 현황과 학생 응시 데이터를 한눈에 확인하세요.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                데이터 초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>데이터 초기화</AlertDialogTitle>
                <AlertDialogDescription>
                  모든 시험, 시도, 배정 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  정말로 계속하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDataClear}>삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 시험 수</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">공개된 시험</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.publishedTests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 배포 수</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행중 시도</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgressAttempts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">제출 완료</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.submittedAttempts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.averageFinalScore}%</div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Recent Changes Panel */}
        <RecentChanges limit={10} />

        <Separator />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              필터 및 검색
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="test-select">시험 선택</Label>
                <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="시험을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 시험</SelectItem>
                    {tests.map(test => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-date">시작 날짜</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end-date">종료 날짜</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                총 {filteredAttempts.length}개의 시도가 검색되었습니다.
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateBulkPDF} 
                  disabled={filteredAttempts.length === 0}
                  variant="outline"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  일괄 PDF
                </Button>
                <Button onClick={downloadCSV} disabled={filteredAttempts.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV 다운로드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attempts Table */}
        <Card>
          <CardHeader>
            <CardTitle>시험 시도 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAttempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                조건에 맞는 시험 시도가 없습니다.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AttemptID</TableHead>
                      <TableHead>응시자명</TableHead>
                      <TableHead>학제/학년</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>시험명</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Auto</TableHead>
                      <TableHead>Human</TableHead>
                       <TableHead>Final</TableHead>
                       <TableHead>제출 시각</TableHead>
                       <TableHead>PDF</TableHead>
                       <TableHead>결과링크</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredAttempts.map((attempt) => (
                       <TableRow key={attempt.id}>
                         <TableCell className="font-mono text-xs">
                           {attempt.id.slice(0, 8)}...
                         </TableCell>
                         <TableCell>
                           {attempt.candidate?.name || '-'}
                         </TableCell>
                         <TableCell>
                           {attempt.candidate ? `${attempt.candidate.system} ${attempt.candidate.grade}` : '-'}
                         </TableCell>
                         <TableCell>
                           {attempt.candidate?.phone || '-'}
                         </TableCell>
                         <TableCell className="font-medium">
                           {attempt.testName}
                         </TableCell>
                         <TableCell>
                           <Badge variant="outline">{attempt.system}</Badge>
                         </TableCell>
                         <TableCell>
                           <Badge variant="secondary">{attempt.grade}</Badge>
                         </TableCell>
                        <TableCell>
                          {getStatusBadge(attempt.status, attempt.reviewStatus)}
                        </TableCell>
                        <TableCell>
                          {attempt.autoTotal || 0} / {attempt.maxTotal || 0}
                        </TableCell>
                        <TableCell>
                          {attempt.humanTotal !== undefined ? attempt.humanTotal : '-'}
                        </TableCell>
                        <TableCell>
                          {attempt.finalTotal !== undefined ? (
                            <span className="font-medium">
                              {attempt.finalTotal} / {attempt.maxTotal}
                            </span>
                          ) : '-'}
                        </TableCell>
                         <TableCell className="text-sm">
                           {attempt.submittedAt ? formatDate(attempt.submittedAt) : '-'}
                         </TableCell>
                          <TableCell>
                            {attempt.status === 'submitted' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleGeneratePDF(attempt)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {attempt.status === 'submitted' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenResultTokenModal(attempt)}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                       </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result Token Generator Modal */}
        {selectedAttemptForToken && (
          <ResultTokenGenerator
            isOpen={isResultTokenModalOpen}
            onClose={() => {
              setIsResultTokenModalOpen(false);
              setSelectedAttemptForToken(null);
            }}
            attempt={convertToStudentTestAttempt(selectedAttemptForToken)}
          />
        )}
      </div>
    </AdminLayout>
  );
}