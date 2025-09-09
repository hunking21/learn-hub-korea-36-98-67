import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTestVersions } from '@/hooks/useTestVersions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, BookOpen, Calendar, FileDown } from 'lucide-react';
import { generateOfflinePDF } from '@/utils/pdfOfflineGenerator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function TestSelect() {
  const { profile } = useAuth();
  const { testVersions, loading, error } = useTestVersions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">오류가 발생했습니다</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const handleStartTest = (testVersion: any) => {
    // 시험 시작 로직
    navigate(`/admin-test/${testVersion.master_id}/${testVersion.id}`);
  };

  const handleDownloadOfflinePDF = async (testVersion: any) => {
    try {
      toast.loading('PDF 생성 중...');
      
      const pdfData = {
        testId: testVersion.master_id,
        versionId: testVersion.id,
        layoutSeed: Math.floor(Math.random() * 1000000), // 임의의 시드
        numQuestions: 20, // 임시 값
        testName: testVersion.test_masters?.name || '시험명 없음',
        gradeLevel: testVersion.grade_level,
        systemType: testVersion.system_type,
        sections: [
          {
            type: 'Reading',
            questions: Array.from({ length: 15 }, (_, i) => ({
              id: `q${i + 1}`,
              type: 'MCQ' as const,
              prompt: `문제 ${i + 1}`,
              choices: ['선택지 A', '선택지 B', '선택지 C', '선택지 D', '선택지 E']
            }))
          },
          {
            type: 'Speaking',
            questions: Array.from({ length: 3 }, (_, i) => ({
              id: `sq${i + 1}`,
              type: 'Speaking' as const,
              prompt: `말하기 문제 ${i + 1}`
            }))
          },
          {
            type: 'Writing',
            questions: Array.from({ length: 2 }, (_, i) => ({
              id: `wq${i + 1}`,
              type: 'Short' as const,
              prompt: `쓰기 문제 ${i + 1}`
            }))
          }
        ]
      };

      await generateOfflinePDF(pdfData);
      toast.success('PDF가 다운로드되었습니다');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      toast.error('PDF 생성에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">시험 선택</h1>
            <p className="text-muted-foreground">
              응시 가능한 시험을 선택하세요
            </p>
          </div>

          {testVersions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                응시 가능한 시험이 없습니다
              </h2>
              <p className="text-muted-foreground mb-6">
                현재 배정받은 시험이나 공개된 시험이 없습니다.
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline"
              >
                대시보드로 돌아가기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testVersions.map((testVersion) => (
                <Card key={testVersion.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">
                        {testVersion.test_masters?.name || '시험명 없음'}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={testVersion.visibility === 'public' ? 'default' : 'secondary'}>
                          {testVersion.visibility === 'public' ? '공개' : '비공개'}
                        </Badge>
                        <Badge variant={testVersion.access_mode === 'open' ? 'default' : 'outline'}>
                          {testVersion.access_mode === 'open' ? '자유응시' : '배정'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {testVersion.test_masters?.description || '설명이 없습니다'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{testVersion.grade_level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{testVersion.system_type}</span>
                      </div>
                      {testVersion.time_limit_minutes && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{testVersion.time_limit_minutes}분</span>
                        </div>
                      )}
                      {testVersion.max_attempts && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>최대 {testVersion.max_attempts}회</span>
                        </div>
                      )}
                    </div>

                    {testVersion.opens_at && (
                      <div className="text-xs text-muted-foreground">
                        시작: {new Date(testVersion.opens_at).toLocaleString('ko-KR')}
                      </div>
                    )}
                    
                    {testVersion.closes_at && (
                      <div className="text-xs text-muted-foreground">
                        마감: {new Date(testVersion.closes_at).toLocaleString('ko-KR')}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleStartTest(testVersion)}
                        className="w-full"
                        disabled={
                          testVersion.closes_at && 
                          new Date(testVersion.closes_at) < new Date()
                        }
                      >
                        {testVersion.closes_at && new Date(testVersion.closes_at) < new Date() 
                          ? '응시 기간 종료' 
                          : '시험 시작'
                        }
                      </Button>
                      
                      <Button 
                        onClick={() => handleDownloadOfflinePDF(testVersion)}
                        variant="outline"
                        className="w-full"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        오프라인 패키지 (PDF)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
