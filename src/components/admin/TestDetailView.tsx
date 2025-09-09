import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ArrowLeft, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TestVersionsTabs } from "./TestVersionsTabs";
import { TestSectionsTab } from "./TestSectionsTab";
import { SectionQuestionManagement } from "./SectionQuestionManagement";
import { ExamOptionsSection } from "./ExamOptionsSection";
import { VersionStatsBadges } from "@/components/ui/version-stats-badges";
import { calculateVersionStatsFromSupabase, type VersionStats } from "@/utils/testVersionStats";

interface TestMaster {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  time_limit_minutes: number | null;
  created_at: string;
  test_versions?: TestVersion[];
}

interface TestVersion {
  id: string;
  master_id: string;
  grade_level: string;
  system_type: string;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_at: string;
}

interface TestDetailViewProps {
  testMaster: TestMaster;
  onBack: () => void;
  onUpdate: () => void;
}

export function TestDetailView({ testMaster: initialMaster, onBack, onUpdate }: TestDetailViewProps) {
  const [currentMaster, setCurrentMaster] = useState<TestMaster>(initialMaster);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [showEditMaster, setShowEditMaster] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TestVersion | null>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedVersionStats, setSelectedVersionStats] = useState<VersionStats | null>(null);
  const { toast } = useToast();
  const { sessionToken } = useAuth();

  // 마스터 데이터 새로고침 함수
  const refreshMasterData = async () => {
    try {
      const { data, error } = await supabase
        .from('test_masters')
        .select(`
          *,
          test_versions(*)
        `)
        .eq('id', initialMaster.id)
        .single();

      if (error) throw error;
      setCurrentMaster(data);
      
      // 선택된 버전의 통계도 업데이트
      if (selectedVersion) {
        await loadSelectedVersionStats(selectedVersion.id);
      }
    } catch (error) {
      console.error('Error refreshing master data:', error);
    }
  };

  // 선택된 버전의 통계 로드
  const loadSelectedVersionStats = async (versionId: string) => {
    try {
      const { data: sections } = await supabase
        .from('test_sections')
        .select(`
          id,
          name,
          time_limit_minutes,
          test_section_questions!inner (
            id,
            points
          )
        `)
        .eq('version_id', versionId)
        .order('order_index', { ascending: true });

      if (sections) {
        const sectionsWithQuestionCount = sections.map(section => ({
          ...section,
          question_count: section.test_section_questions?.length || 0
        }));
        
        const stats = calculateVersionStatsFromSupabase(sectionsWithQuestionCount);
        setSelectedVersionStats(stats);
      } else {
        setSelectedVersionStats({ sectionCount: 0, questionCount: 0, totalPoints: 0, totalTimeMinutes: 0 });
      }
    } catch (error) {
      console.error('Error loading version stats:', error);
      setSelectedVersionStats({ sectionCount: 0, questionCount: 0, totalPoints: 0, totalTimeMinutes: 0 });
    }
  };

  // Form states
  const [versionForm, setVersionForm] = useState({
    selectedSystems: [] as string[],
    selectedGradesBySystem: {} as Record<string, string[]>,
    time_limit_minutes: null as number | null
  });

  // 시스템별 학년 옵션
  const SYSTEM_GRADES = {
    "한국": ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"],
    "미국": [
      "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
    ],
    "영국": [
      "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5", "Yr 6", "Yr 7", "Yr 8", "Yr 9", "Yr 10", "Yr 11", "Yr 12", "Yr 13"
    ]
  };

  const SYSTEMS = ["한국", "미국", "영국"];

  const [masterEditForm, setMasterEditForm] = useState({
    name: currentMaster.name,
    description: currentMaster.description || "",
    is_public: currentMaster.is_public,
    time_limit_minutes: currentMaster.time_limit_minutes
  });

  const createTestVersion = async () => {
    try {
      // Ensure session token is set before database operation
      if (sessionToken) {
        await Promise.all([
          supabase.rpc('set_request_header', {
            key: 'request.jwt.claims',
            value: JSON.stringify({ session_token: sessionToken })
          }),
          supabase.rpc('set_request_header', {
            key: 'app.session_token',
            value: sessionToken
          })
        ]);
      }

      // 선택된 시스템과 학년의 모든 조합에 대해 버전 생성
      const versionPromises = [];
      for (const system of versionForm.selectedSystems) {
        const grades = versionForm.selectedGradesBySystem[system] || [];
        for (const grade of grades) {
          versionPromises.push(
            supabase
              .from('test_versions')
              .insert([{
                master_id: currentMaster.id,
                grade_level: grade,
                system_type: system,
                time_limit_minutes: versionForm.time_limit_minutes
              }])
              .select()
          );
        }
      }

      const results = await Promise.all(versionPromises);
      
      // Check for errors
      for (const result of results) {
        if (result.error) throw result.error;
      }

      const totalVersions = versionPromises.length;
      toast({
        title: "성공",
        description: `${totalVersions}개의 학년별 버전이 추가되었습니다.`
      });

      setShowCreateVersion(false);
      setVersionForm({ selectedSystems: [], selectedGradesBySystem: {}, time_limit_minutes: null });
      
      // 즉시 마스터 데이터와 상위 컴포넌트 모두 새로고침
      await refreshMasterData();
      onUpdate();
    } catch (error) {
      console.error('Error creating test version:', error);
      toast({
        title: "오류",
        description: "학년별 버전 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const updateTestMaster = async () => {
    try {
      // Ensure session token is set before database operation
      if (sessionToken) {
        await Promise.all([
          supabase.rpc('set_request_header', {
            key: 'request.jwt.claims',
            value: JSON.stringify({ session_token: sessionToken })
          }),
          supabase.rpc('set_request_header', {
            key: 'app.session_token',
            value: sessionToken
          })
        ]);
      }

      const { error } = await supabase
        .from('test_masters')
        .update(masterEditForm)
        .eq('id', currentMaster.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "시험 정보가 수정되었습니다."
      });

      setShowEditMaster(false);
      await refreshMasterData();
      onUpdate();
    } catch (error) {
      console.error('Error updating test master:', error);
      toast({
        title: "오류",
        description: "시험 정보 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const deleteTestVersion = async (versionId: string) => {
    if (!confirm('이 학년별 버전을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('test_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "학년별 버전이 삭제되었습니다."
      });

      await refreshMasterData();
      onUpdate();
    } catch (error) {
      console.error('Error deleting test version:', error);
      toast({
        title: "오류",
        description: "학년별 버전 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 섹션 문제 관리 화면 */}
      {selectedSection ? (
        <SectionQuestionManagement
          section={selectedSection}
          onBack={() => setSelectedSection(null)}
          onUpdate={() => {
            refreshMasterData();
            if (selectedVersion) {
              loadSelectedVersionStats(selectedVersion.id);
            }
          }}
        />
      ) : selectedVersion ? (
        /* 선택된 버전의 섹션 관리 화면 */
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedVersion(null)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                버전 목록으로
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentMaster.name}</h1>
                <p className="text-muted-foreground">
                  {selectedVersion.system_type}제 {selectedVersion.grade_level} - 섹션 및 문제 관리
                </p>
              </div>
            </div>
            {/* 버전 통계 */}
            {selectedVersionStats && (
              <div className="mt-4">
                <VersionStatsBadges stats={selectedVersionStats} />
              </div>
            )}
          </div>

          {/* 섹션 관리 */}
          <TestSectionsTab
            selectedVersion={selectedVersion}
            onUpdate={() => {
              refreshMasterData();
              if (selectedVersion) {
                loadSelectedVersionStats(selectedVersion.id);
              }
            }}
            onSectionSelect={setSelectedSection}
          />
        </div>
      ) : (
        /* 기본 화면 - 학년별 버전 목록 */
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                목록으로
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentMaster.name}</h1>
                <p className="text-muted-foreground">{currentMaster.description}</p>
              </div>
            </div>
            
            <Dialog open={showEditMaster} onOpenChange={setShowEditMaster}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  시험 정보 수정
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>시험 정보 수정</DialogTitle>
                  <DialogDescription>시험 기본정보를 수정합니다.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_name">시험 이름</Label>
                    <Input
                      id="edit_name"
                      value={masterEditForm.name}
                      onChange={(e) => setMasterEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_description">설명</Label>
                    <Textarea
                      id="edit_description"
                      value={masterEditForm.description}
                      onChange={(e) => setMasterEditForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit_is_public">공개 시험</Label>
                    <Switch
                      id="edit_is_public"
                      checked={masterEditForm.is_public}
                      onCheckedChange={(checked) => setMasterEditForm(prev => ({ ...prev, is_public: checked }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_time_limit">전체 시간 제한 (분)</Label>
                    <Input
                      id="edit_time_limit"
                      type="number"
                      value={masterEditForm.time_limit_minutes || ""}
                      onChange={(e) => setMasterEditForm(prev => ({ 
                        ...prev, 
                        time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowEditMaster(false)}>
                      취소
                    </Button>
                    <Button onClick={updateTestMaster}>
                      수정
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Master Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>시험 기본 정보</span>
                <div className="flex items-center gap-2">
                  <Badge variant={currentMaster.is_public ? "default" : "secondary"}>
                    {currentMaster.is_public ? "공개" : "비공개"}
                  </Badge>
                  {currentMaster.time_limit_minutes && (
                    <Badge variant="outline">{currentMaster.time_limit_minutes}분</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">생성일</dt>
                  <dd className="text-sm">{new Date(currentMaster.created_at).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">학년별 버전 수</dt>
                  <dd className="text-sm">{currentMaster.test_versions?.length || 0}개</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 학년별 버전 관리 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>학년별 버전 관리</CardTitle>
                  <CardDescription>
                    학년별 버전을 선택하여 섹션과 문제를 관리하세요
                  </CardDescription>
                </div>
                
                <Dialog open={showCreateVersion} onOpenChange={setShowCreateVersion}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      학년별 버전 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>학년별 버전 추가</DialogTitle>
                      <DialogDescription>여러 시스템과 학년을 선택해 한 번에 버전을 생성합니다.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>시스템 종류 (다중 선택 가능)</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2 p-3 border rounded-md">
                          {SYSTEMS.map((system) => (
                            <div key={system} className="flex items-center space-x-2">
                              <Checkbox
                                id={`system-${system}`}
                                checked={versionForm.selectedSystems.includes(system)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setVersionForm(prev => ({
                                      ...prev,
                                      selectedSystems: [...prev.selectedSystems, system]
                                    }));
                                  } else {
                                    setVersionForm(prev => ({
                                      ...prev,
                                      selectedSystems: prev.selectedSystems.filter(s => s !== system),
                                      selectedGradesBySystem: {
                                        ...prev.selectedGradesBySystem,
                                        [system]: [] // 시스템 해제 시 해당 시스템의 학년 선택 초기화
                                      }
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={`system-${system}`} className="text-sm font-normal cursor-pointer">
                                {system}제
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {versionForm.selectedSystems.map((system) => (
                        <div key={system}>
                          <Label>{system}제 학년 선택</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                            {SYSTEM_GRADES[system as keyof typeof SYSTEM_GRADES]?.map((grade) => (
                              <div key={`${system}-${grade}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${system}-${grade}`}
                                  checked={versionForm.selectedGradesBySystem[system]?.includes(grade) || false}
                                  onCheckedChange={(checked) => {
                                    const currentGrades = versionForm.selectedGradesBySystem[system] || [];
                                    if (checked) {
                                      setVersionForm(prev => ({
                                        ...prev,
                                        selectedGradesBySystem: {
                                          ...prev.selectedGradesBySystem,
                                          [system]: [...currentGrades, grade]
                                        }
                                      }));
                                    } else {
                                      setVersionForm(prev => ({
                                        ...prev,
                                        selectedGradesBySystem: {
                                          ...prev.selectedGradesBySystem,
                                          [system]: currentGrades.filter(g => g !== grade)
                                        }
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={`${system}-${grade}`} className="text-sm font-normal cursor-pointer">
                                  {grade}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* 선택된 조합 미리보기 */}
                      {versionForm.selectedSystems.length > 0 && (
                        <div>
                          <Label>생성될 버전 미리보기</Label>
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            {versionForm.selectedSystems.map(system => {
                              const grades = versionForm.selectedGradesBySystem[system] || [];
                              return grades.map(grade => (
                                <div key={`${system}-${grade}`} className="text-sm">
                                  • {system}제 {grade}
                                </div>
                              ));
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="version_time_limit">시간 제한 (분)</Label>
                        <Input
                          id="version_time_limit"
                          type="number"
                          placeholder="제한 없음은 비워두세요"
                          value={versionForm.time_limit_minutes || ""}
                          onChange={(e) => setVersionForm(prev => ({ 
                            ...prev, 
                            time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateVersion(false)}>
                          취소
                        </Button>
                        <Button 
                          onClick={createTestVersion}
                          disabled={versionForm.selectedSystems.length === 0 || 
                                    !versionForm.selectedSystems.some(system => 
                                      (versionForm.selectedGradesBySystem[system] || []).length > 0
                                    )}
                        >
                          {versionForm.selectedSystems.reduce((total, system) => 
                            total + (versionForm.selectedGradesBySystem[system] || []).length, 0
                          )}개 버전 추가
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <TestVersionsTabs
                versions={currentMaster.test_versions || []}
                onDeleteVersion={deleteTestVersion}
                onUpdate={refreshMasterData}
                onVersionSelect={(version) => {
                  setSelectedVersion(version);
                  loadSelectedVersionStats(version.id);
                }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}