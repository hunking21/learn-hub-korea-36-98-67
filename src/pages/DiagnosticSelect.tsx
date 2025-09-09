import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface DiagnosticResult {
  subject: string;
  score: number;
  maxScore: number;
  grade: string;
  completedAt: string;
}

const diagnosticSubjects = [
  { 
    key: "Math", 
    label: "Math",
    description: "기본 연산, 문제 해결 능력을 진단합니다.",
    duration: "15-20분",
    questions: "약 10문제"
  },
  { 
    key: "English Reading", 
    label: "Reading",
    description: "영어 읽기 이해력과 어휘력을 진단합니다.",
    duration: "20-25분",
    questions: "약 8문제"
  },
  { 
    key: "English Writing", 
    label: "Writing",
    description: "영어 문법과 작문 능력을 진단합니다.",
    duration: "25-30분",
    questions: "약 5문제"
  },
  { 
    key: "Speaking", 
    label: "Interview",
    description: "발음과 유창성을 진단합니다.",
    duration: "10-15분",
    questions: "약 3문제"
  }
];

const DiagnosticSelect = () => {
  const [searchParams] = useSearchParams();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [completedSubjects, setCompletedSubjects] = useState<DiagnosticResult[]>([]);
  const navigate = useNavigate();
  
  const system = searchParams.get('system');
  const grade = searchParams.get('grade');

  // 로컬 스토리지에서 완료된 진단고사 결과 불러오기
  useEffect(() => {
    const storageKey = `diagnostic_results_${system}_${grade}`;
    const savedResults = localStorage.getItem(storageKey);
    if (savedResults) {
      try {
        setCompletedSubjects(JSON.parse(savedResults));
      } catch (error) {
        console.error("진단고사 결과 로드 실패:", error);
      }
    }
  }, [system, grade]);

  useEffect(() => {
    document.title = "진단고사 안내 | 과목 선택";

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", "진단고사 안내: 과목별 맞춤 진단으로 학습 수준을 정확히 파악하세요.");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);
  }, []);

  const getSubjectResult = (subjectKey: string) => {
    return completedSubjects.find(result => result.subject === subjectKey);
  };

  const handleStart = () => {
    if (selectedSubject && system && grade) {
      navigate(`/test/progress?system=${encodeURIComponent(system)}&grade=${encodeURIComponent(grade)}&exam=${encodeURIComponent(selectedSubject)}`);
    }
  };

  const handleViewResult = (subjectKey: string) => {
    const result = getSubjectResult(subjectKey);
    if (result) {
      // 결과 상세 보기
      alert(`${diagnosticSubjects.find(s => s.key === subjectKey)?.label} 결과\n점수: ${result.score}/${result.maxScore}\n등급: ${result.grade}\n완료일: ${new Date(result.completedAt).toLocaleDateString()}`);
    }
  };

  const isAllCompleted = completedSubjects.length === diagnosticSubjects.length;

  return (
    <AppLayout 
      title="학습 진단고사"
      subtitle={`${system === "korea" ? "한국 학년제" : system === "us" ? "미국 학년제" : "영국 학년제"} ${grade} 맞춤 진단`}
      showBackButton={true}
      backPath="/test/select"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 간단한 소개 */}
        <div className="text-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full text-primary-foreground mb-4">
            🎯
          </div>
          <h1 className="text-xl font-bold mb-2">나의 학습 수준을 확인해보세요</h1>
          <p className="text-muted-foreground text-sm mb-3">
            4개 과목 진단으로 정확한 학습 분석을 받아보세요
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              💡 <strong>중요:</strong> 4개 과목을 모두 완료해야 종합 학습 분석 리포트를 받을 수 있습니다
            </p>
          </div>
        </div>

        {/* 진행률 표시 */}
        {completedSubjects.length > 0 && (
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">진행 상황</span>
              <span className="text-sm text-muted-foreground">
                {completedSubjects.length}/{diagnosticSubjects.length} 완료
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubjects.length / diagnosticSubjects.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 모든 과목 완료 시 완료 화면 */}
        {isAllCompleted ? (
          <section className="space-y-8">
            {/* 완료 축하 메시지 */}
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                🎉 모든 진단고사를 완료하셨습니다!
              </h2>
              <p className="text-green-700 dark:text-green-300 mb-6">
                총 {diagnosticSubjects.length}개 과목의 진단고사를 모두 성공적으로 완료하셨습니다.
              </p>
            </div>

            {/* 종합 결과 요약 */}
            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-xl font-bold text-academy-text mb-4 flex items-center gap-2">
                📊 종합 결과 요약
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {diagnosticSubjects.map((subject) => {
                  const result = getSubjectResult(subject.key);
                  return (
                    <div key={subject.key} className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-academy-text">{subject.label}</h4>
                      </div>
                      {result && (
                        <>
                          <div className="text-2xl font-bold text-academy-text mb-1">
                            {result.grade}
                          </div>
                          <div className="text-sm text-academy-muted">
                            {result.score}/{result.maxScore}점
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 다음 단계 안내 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                🚀 다음 단계
              </h3>
              <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-start gap-2">
                  <span className="font-semibold">1.</span>
                  <span>진단 결과를 바탕으로 개인별 맞춤 학습 계획이 생성됩니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  <span>부족한 영역을 중심으로 한 맞춤형 문제들을 추천받을 수 있습니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold">3.</span>
                  <span>정기적인 재진단을 통해 학습 진도를 확인하실 수 있습니다.</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/test/select')}
                variant="outline"
                size="lg"
                className="border-academy-brown/30 text-academy-brown hover:bg-academy-brown/5"
              >
                다른 테스트 보기
              </Button>
              <Button 
                onClick={() => navigate('/')}
                size="lg"
                className="bg-academy-brown hover:bg-academy-brown/90"
              >
                홈으로 돌아가기
              </Button>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {/* 과목 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnosticSubjects.map((subject) => {
                const result = getSubjectResult(subject.key);
                const isCompleted = !!result;
                
                return (
                  <div 
                    key={subject.key}
                    className={`relative p-4 border rounded-xl transition-all cursor-pointer group ${
                      isCompleted 
                        ? 'border-green-200 bg-green-50 pointer-events-none' 
                        : selectedSubject === subject.key 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => !isCompleted && setSelectedSubject(subject.key)}
                  >
                    {/* 완료 표시 */}
                    {isCompleted && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700' 
                          : selectedSubject === subject.key 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                      }`}>
                        {subject.label.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{subject.label}</h3>
                      </div>
                    </div>
                    
                    {/* 완료된 과목 결과 */}
                    {isCompleted && result && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600">완료</Badge>
                            <span className="text-sm font-medium">{result.grade} 등급</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {result.score}/{result.maxScore}점
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex gap-3">
                        <span className="flex items-center gap-1">
                          ⏱️ {subject.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          📝 {subject.questions}
                        </span>
                      </div>
                      
                      {!isCompleted && (
                        <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                          selectedSubject === subject.key 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedSubject && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                    📋 {diagnosticSubjects.find(s => s.key === selectedSubject)?.label} 테스트 안내
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-1">
                        📝 문제 수
                      </div>
                      <p className="text-foreground">
                        {diagnosticSubjects.find(s => s.key === selectedSubject)?.questions}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-1">
                        ⏱️ 소요 시간
                      </div>
                      <p className="text-foreground">
                        {diagnosticSubjects.find(s => s.key === selectedSubject)?.duration}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-red-500 text-lg">⚠️</div>
                    <div>
                      <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">중요 안내사항</h4>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        <li>• 테스트 시작 후 중단하는 것은 권장하지 않습니다</li>
                        <li>• 정확한 진단을 위해 한 번에 완료해주세요</li>
                        <li>• 조용한 환경에서 집중해서 응시하세요</li>
                        {selectedSubject === "Speaking" && (
                          <li>• 카메라와 마이크 권한이 필요합니다</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    onClick={handleStart}
                    size="lg"
                    className="w-full sm:w-auto px-8"
                  >
                    🚀 {diagnosticSubjects.find(s => s.key === selectedSubject)?.label} 테스트 시작하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DiagnosticSelect;