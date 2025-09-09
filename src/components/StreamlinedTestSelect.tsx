import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import SystemSelector from "@/components/test-select/SystemSelector";
import GradeSelector from "@/components/test-select/GradeSelector";
import ProgressIndicator from "@/components/ProgressIndicator";
import { useAdminTests } from "@/hooks/useAdminTests";
import { BookOpen, Clock, GraduationCap, FileText } from "lucide-react";

type SystemType = "korea" | "us" | "uk";

const StreamlinedTestSelect = () => {
  const [step, setStep] = useState(1);
  const [selectedTestMaster, setSelectedTestMaster] = useState<string | null>(null);
  const [system, setSystem] = useState<SystemType | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [selectedAdminTest, setSelectedAdminTest] = useState<{
    masterId: string;
    versionId: string;
    sectionId?: string;
  } | null>(null);
  const navigate = useNavigate();

  // 모든 관리자 테스트 가져오기 (유형 선택용)
  const { tests: allAdminTests, isLoading: allTestsLoading } = useAdminTests({});
  
  // 필터링된 관리자 테스트 데이터 가져오기 (선택된 조건 기반)
  const { tests: adminTests, isLoading: adminLoading } = useAdminTests({
    system: system === 'korea' ? '한국' : system === 'us' ? '미국' : system === 'uk' ? '영국' : undefined,
    grade
  });

  // 선택된 테스트 마스터에 해당하는 테스트만 필터링
  const filteredTests = adminTests.filter(test => 
    selectedTestMaster ? test.id === selectedTestMaster : true
  );

  // 완성된 테스트만 필터링
  const availableTests = filteredTests.filter(test => 
    test.test_versions.some(version => 
      version.test_sections.some(section => (section.question_count || 0) > 0)
    )
  );

  // 선택된 테스트 마스터 정보 가져오기
  const selectedTestInfo = allAdminTests.find(test => test.id === selectedTestMaster);

  const handleNext = () => {
    if (step === 1 && selectedTestMaster) {
      setStep(2);
    } else if (step === 2 && system) {
      setStep(3);
    } else if (step === 3 && grade) {
      setStep(4);
    }
  };

  const handleStart = () => {
    if (selectedAdminTest) {
      // Navigate to admin test start page
      navigate(`/admin-test/${selectedAdminTest.masterId}/${selectedAdminTest.versionId}${selectedAdminTest.sectionId ? `/${selectedAdminTest.sectionId}` : ''}`);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setSystem(null);
        setGrade(null);
        setSelectedAdminTest(null);
      } else if (step === 3) {
        setGrade(null);
        setSelectedAdminTest(null);
      } else if (step === 4) {
        setSelectedAdminTest(null);
      }
    }
  };

  const handleTestMasterSelect = (testId: string) => {
    setSelectedTestMaster(testId);
    setSystem(null);
    setGrade(null);
    setSelectedAdminTest(null);
  };

  const handleSystemSelect = (selectedSystem: SystemType) => {
    setSystem(selectedSystem);
    setGrade(null);
    setSelectedAdminTest(null);
  };

  const handleGradeSelect = (selectedGrade: string) => {
    setGrade(selectedGrade);
    setSelectedAdminTest(null);
  };

  const getTestIcon = (testName: string) => {
    if (testName.includes('진단')) {
      return <GraduationCap className="h-6 w-6 text-blue-600" />;
    } else if (testName.toUpperCase().includes('SSAT')) {
      return <FileText className="h-6 w-6 text-green-600" />;
    }
    return <BookOpen className="h-6 w-6 text-purple-600" />;
  };

  const getTestColor = (testName: string) => {
    if (testName.includes('진단')) {
      return 'bg-blue-100';
    } else if (testName.toUpperCase().includes('SSAT')) {
      return 'bg-green-100';
    }
    return 'bg-purple-100';
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "테스트 유형 선택";
      case 2: return "교육 시스템 선택";
      case 3: return "학년 선택";
      case 4: return "시험 선택";
      default: return "테스트 선택";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "치고싶은 시험 종류를 선택해주세요";
      case 2: return "현재 다니고 있는 교육 시스템을 선택해주세요";
      case 3: return "현재 학년을 선택해주세요";
      case 4: return "시험을 선택하고 시작하세요";
      default: return "";
    }
  };

  useEffect(() => {
    document.title = `${getStepTitle()} | TN Academy`;
  }, [step]);

  return (
    <AppLayout 
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      showBackButton={false}
      showHomeButton={true}
    >
      <div className="max-w-4xl mx-auto">
        <ProgressIndicator 
          currentStep={step} 
          totalSteps={4} 
          stepLabels={["테스트 유형", "교육 시스템", "학년", "시험 선택"]}
        />

        {/* Step 1: 테스트 유형 선택 */}
        {step === 1 && (
          <div className="space-y-8">
            {allTestsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">테스트를 불러오는 중...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {allAdminTests.map((test) => (
                  <Card 
                    key={test.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedTestMaster === test.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTestMasterSelect(test.id)}
                  >
                    <CardHeader className="text-center">
                      <div className={`mx-auto w-12 h-12 ${getTestColor(test.name)} rounded-full flex items-center justify-center mb-4`}>
                        {getTestIcon(test.name)}
                      </div>
                      <CardTitle className="text-xl">{test.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">
                        {test.description || '테스트 설명이 없습니다.'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={handleNext}
                disabled={!selectedTestMaster}
                size="lg"
              >
                다음 단계 →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: 시스템 선택 */}
        {step === 2 && (
          <div className="space-y-8">
            <SystemSelector 
              selected={system} 
              onSelect={handleSystemSelect} 
            />

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleBack}>
                ← 이전 단계
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!system}
                size="lg"
              >
                다음 단계 →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 학년 선택 */}
        {step === 3 && (
          <div className="space-y-8">
            {system && (
              <GradeSelector 
                system={system} 
                selected={grade} 
                onSelect={handleGradeSelect} 
              />
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleBack}>
                ← 이전 단계
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!grade}
                size="lg"
              >
                다음 단계 →
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: 시험 선택 */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {selectedTestInfo?.name} 선택
              </h2>
              <p className="text-muted-foreground">
                {system === 'korea' ? '한국' : system === 'us' ? '미국' : '영국'}제 {grade} 학년에 해당하는 시험을 선택하세요
              </p>
            </div>

            {adminLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">시험을 불러오는 중...</p>
              </div>
            ) : availableTests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">사용 가능한 시험이 없습니다</h3>
                <p className="text-muted-foreground">
                  {selectedTestInfo?.name} - {system === 'korea' ? '한국' : system === 'us' ? '미국' : '영국'}제 {grade} 학년에 
                  해당하는 완성된 시험이 아직 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableTests.map((test) => (
                  <div key={test.id} className="space-y-2">
                    <h3 className="font-semibold text-lg">{test.name}</h3>
                    {test.description && (
                      <p className="text-sm text-muted-foreground mb-4">{test.description}</p>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                      {test.test_versions
                        .filter(version => 
                          version.system_type === (system === 'korea' ? '한국' : system === 'us' ? '미국' : '영국') &&
                          version.grade_level === grade
                        )
                        .map((version) => (
                        <Card 
                          key={version.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedAdminTest?.versionId === version.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedAdminTest({
                            masterId: test.id,
                            versionId: version.id
                          })}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">
                                {version.system_type}제 {version.grade_level}
                              </CardTitle>
                              <Badge variant="outline">
                                {version.test_sections.length}개 섹션
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {version.test_sections.reduce((total, section) => 
                                        total + (section.question_count || 0), 0
                                      )}문제
                                    </span>
                                  </div>
                                  {version.time_limit_minutes && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>{version.time_limit_minutes}분</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                섹션: {version.test_sections.map(s => s.name).join(', ')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleBack}>
                ← 이전 단계
              </Button>
              <Button 
                onClick={handleStart}
                disabled={!selectedAdminTest}
                size="lg"
              >
                시험 시작하기
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StreamlinedTestSelect;