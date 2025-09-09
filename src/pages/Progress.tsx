import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { CheckCircle, Clock, Play } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface CompletedTest {
  subject: string;
  score: number;
  maxScore: number;
  grade: string;
  completedAt: string;
  system?: string;
  gradeLevel?: string;
}

interface DiagnosticProgress {
  system: string;
  gradeLevel: string;
  completedSubjects: string[];
  totalSubjects: number;
  progress: number;
}

const allSubjects = ['Math', 'Reading', 'Writing', 'Interview'];

const Progress = () => {
  const navigate = useNavigate();
  const [diagnosticProgress, setDiagnosticProgress] = useState<DiagnosticProgress[]>([]);
  const [recentTests, setRecentTests] = useState<CompletedTest[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    const progressMap = new Map<string, DiagnosticProgress>();
    const allTests: CompletedTest[] = [];
    
    // localStorage에서 진단고사 결과 가져오기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('diagnostic_results_')) {
        try {
          const results = JSON.parse(localStorage.getItem(key) || '[]');
          const [, , system, gradeLevel] = key.split('_');
          const progressKey = `${system}_${gradeLevel}`;
          
          const completedSubjects = results.map((r: any) => r.subject);
          
          progressMap.set(progressKey, {
            system,
            gradeLevel,
            completedSubjects,
            totalSubjects: allSubjects.length,
            progress: Math.round((completedSubjects.length / allSubjects.length) * 100)
          });

          results.forEach((result: any) => {
            allTests.push({
              ...result,
              system,
              gradeLevel
            });
          });
        } catch (error) {
          console.error('결과 파싱 오류:', error);
        }
      }
    }

    setDiagnosticProgress(Array.from(progressMap.values()));
    
    // 최근 3개 테스트만 표시
    allTests.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    setRecentTests(allTests.slice(0, 3));
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Math':
        return '🔢';
      case 'Reading':
        return '📖';
      case 'Writing':
        return '✍️';
      case 'Interview':
        return '🎤';
      default:
        return '📝';
    }
  };

  const getSystemDisplayName = (system: string) => {
    switch (system) {
      case 'korea':
        return '한국 학년제';
      case 'us':
        return '미국 학년제';
      case 'uk':
        return '영국 학년제';
      default:
        return system;
    }
  };

  const handleStartDiagnostic = (system: string, gradeLevel: string) => {
    navigate(`/diagnostic/select?system=${encodeURIComponent(system)}&grade=${encodeURIComponent(gradeLevel)}`);
  };

  if (diagnosticProgress.length === 0) {
    return (
      <AppLayout
        title="학습 진행상황"
        subtitle="현재 진행 중인 테스트와 완료 현황을 확인하세요"
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold mb-4">아직 시작한 진단고사가 없습니다</h2>
          <p className="text-muted-foreground mb-8">
            진단고사를 시작하여 학습 진행상황을 확인해보세요.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/test/select')}
            className="bg-academy-brown hover:bg-academy-brown/90"
          >
            🚀 진단고사 시작하기
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="학습 진행상황"
      subtitle="현재 진행 중인 테스트와 완료 현황을 확인하세요"
    >
      <div className="space-y-8">
        {/* 진행 중인 진단고사들 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-academy-brown" />
            진행 중인 진단고사
          </h2>
          <div className="grid gap-4">
            {diagnosticProgress.map((progress, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getSystemDisplayName(progress.system)} - {progress.gradeLevel}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {progress.completedSubjects.length}/{progress.totalSubjects} 과목 완료
                        </p>
                      </div>
                      <Badge 
                        variant={progress.progress === 100 ? "default" : "outline"}
                        className={progress.progress === 100 ? "bg-green-500 text-white" : ""}
                      >
                        {progress.progress === 100 ? "완료" : `${progress.progress}%`}
                      </Badge>
                    </div>

                    {/* 진행률 바 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>진행률</span>
                        <span className="text-academy-brown font-semibold">{progress.progress}%</span>
                      </div>
                      <ProgressBar value={progress.progress} className="h-2" />
                    </div>

                    {/* 과목별 상태 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {allSubjects.map(subject => {
                        const isCompleted = progress.completedSubjects.includes(subject);
                        return (
                          <div 
                            key={subject} 
                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                              isCompleted 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                          >
                            <span className="text-lg">{getSubjectIcon(subject)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{subject}</div>
                              <div className="flex items-center gap-1">
                                {isCompleted ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Play className="w-3 h-3 text-gray-400" />
                                )}
                                <span className="text-xs">
                                  {isCompleted ? '완료' : '대기'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 액션 버튼 */}
                    {progress.progress < 100 && (
                      <div className="pt-2">
                        <Button 
                          size="sm"
                          onClick={() => handleStartDiagnostic(progress.system, progress.gradeLevel)}
                          className="bg-academy-brown hover:bg-academy-brown/90"
                        >
                          계속하기
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 최근 완료한 테스트 (간단 요약) */}
        {recentTests.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                최근 완료한 테스트
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-academy-brown border-academy-brown/30 hover:bg-academy-brown/5"
              >
                전체 결과 보기
              </Button>
            </div>
            <div className="grid gap-3">
              {recentTests.map((test, index) => (
                <Card key={index} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getSubjectIcon(test.subject)}</span>
                        <div>
                          <div className="font-medium">{test.subject}</div>
                          <div className="text-sm text-muted-foreground">
                            {test.system} - {test.gradeLevel}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-academy-brown">
                          {test.score}/{test.maxScore}점
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(test.completedAt).toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 액션 버튼들 */}
        <section className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/test/select')}
            className="flex-1 bg-academy-brown hover:bg-academy-brown/90"
          >
            새 진단고사 시작
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-1 border-academy-brown/30 text-academy-brown hover:bg-academy-brown/5"
          >
            상세 결과 보기
          </Button>
        </section>
      </div>
    </AppLayout>
  );
};

export default Progress;