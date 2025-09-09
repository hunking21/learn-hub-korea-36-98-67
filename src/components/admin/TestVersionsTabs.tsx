import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Eye, Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { VersionStatsBadges } from "@/components/ui/version-stats-badges";
import { calculateVersionStatsFromSupabase, type VersionStats } from "@/utils/testVersionStats";

interface TestVersion {
  id: string;
  master_id: string;
  grade_level: string;
  system_type: string;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_at: string;
}

interface TestVersionsTabsProps {
  versions: TestVersion[];
  onDeleteVersion: (versionId: string) => void;
  onUpdate: () => void;
  onVersionSelect?: (version: TestVersion) => void;
}

export function TestVersionsTabs({ versions, onDeleteVersion, onUpdate, onVersionSelect }: TestVersionsTabsProps) {
  const [showEditGrades, setShowEditGrades] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TestVersion[]>([]);
  const [editForm, setEditForm] = useState({
    selectedSystems: [] as string[],
    selectedGradesBySystem: {} as Record<string, string[]>
  });
  const [versionStats, setVersionStats] = useState<Record<string, VersionStats>>({});
  const { toast } = useToast();
  const { sessionToken } = useAuth();

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

  // 버전별 통계 데이터 로드
  useEffect(() => {
    const loadVersionStats = async () => {
      const statsMap: Record<string, VersionStats> = {};
      
      for (const version of versions) {
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
            .eq('version_id', version.id)
            .order('order_index', { ascending: true });

          if (sections) {
            const sectionsWithQuestionCount = sections.map(section => ({
              ...section,
              question_count: section.test_section_questions?.length || 0
            }));
            
            statsMap[version.id] = calculateVersionStatsFromSupabase(sectionsWithQuestionCount);
          } else {
            statsMap[version.id] = { sectionCount: 0, questionCount: 0, totalPoints: 0, totalTimeMinutes: 0 };
          }
        } catch (error) {
          console.error('Error loading stats for version:', version.id, error);
          statsMap[version.id] = { sectionCount: 0, questionCount: 0, totalPoints: 0, totalTimeMinutes: 0 };
        }
      }
      
      setVersionStats(statsMap);
    };

    if (versions.length > 0) {
      loadVersionStats();
    }
  }, [versions]);

  if (versions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">아직 생성된 학년별 버전이 없습니다</p>
        <p className="text-sm">위의 '학년별 버전 추가' 버튼을 클릭해서 시작해보세요</p>
      </div>
    );
  }

  // 생성 시간이 매우 가까운 것들(1분 이내)을 같은 배치로 그룹핑
  const sortedVersions = [...versions].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const versionGroups: TestVersion[][] = [];
  let currentGroup: TestVersion[] = [];

  sortedVersions.forEach((version, index) => {
    if (index === 0) {
      currentGroup = [version];
    } else {
      const prevTime = new Date(sortedVersions[index - 1].created_at).getTime();
      const currentTime = new Date(version.created_at).getTime();
      const timeDiff = currentTime - prevTime;
      
      // 1분(60000ms) 이내면 같은 그룹, 아니면 새 그룹
      if (timeDiff <= 60000) {
        currentGroup.push(version);
      } else {
        versionGroups.push(currentGroup);
        currentGroup = [version];
      }
    }
    
    if (index === sortedVersions.length - 1) {
      versionGroups.push(currentGroup);
    }
  });

  const groups = versionGroups
    .reverse() // 최신 그룹부터 보여주기
    .map((groupVersions, index) => {
      // 그룹의 통합 통계 계산
      const groupStats = groupVersions.reduce((acc, version) => {
        const stats = versionStats[version.id];
        if (stats) {
          acc.sectionCount = Math.max(acc.sectionCount, stats.sectionCount);
          acc.questionCount = Math.max(acc.questionCount, stats.questionCount);
          acc.totalPoints = Math.max(acc.totalPoints, stats.totalPoints);
          acc.totalTimeMinutes = Math.max(acc.totalTimeMinutes, stats.totalTimeMinutes);
        }
        return acc;
      }, { sectionCount: 0, questionCount: 0, totalPoints: 0, totalTimeMinutes: 0 });

      return {
        versions: groupVersions,
        groupNumber: versionGroups.length - index,
        systemGrades: groupVersions.reduce((acc, v) => {
          if (!acc[v.system_type]) acc[v.system_type] = [];
          acc[v.system_type].push(v.grade_level);
          return acc;
        }, {} as Record<string, string[]>),
        stats: groupStats
      };
    });

  const handleDeleteGroup = (groupVersions: TestVersion[]) => {
    groupVersions.forEach(version => onDeleteVersion(version.id));
  };

  const handleEditGrades = (groupVersions: TestVersion[]) => {
    setSelectedGroup(groupVersions);
    
    // 현재 그룹의 시스템과 학년 정보로 폼 초기화
    const systemGrades = groupVersions.reduce((acc, v) => {
      if (!acc[v.system_type]) acc[v.system_type] = [];
      if (!acc[v.system_type].includes(v.grade_level)) {
        acc[v.system_type].push(v.grade_level);
      }
      return acc;
    }, {} as Record<string, string[]>);
    
    setEditForm({
      selectedSystems: Object.keys(systemGrades),
      selectedGradesBySystem: systemGrades
    });
    
    setShowEditGrades(true);
  };

  const updateVersionGrades = async () => {
    try {
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

      // 기존 그룹의 모든 버전 삭제
      const deletePromises = selectedGroup.map(version => 
        supabase.from('test_versions').delete().eq('id', version.id)
      );
      await Promise.all(deletePromises);

      // 새로운 선택에 따라 버전 생성
      const versionPromises = [];
      for (const system of editForm.selectedSystems) {
        const grades = editForm.selectedGradesBySystem[system] || [];
        for (const grade of grades) {
          versionPromises.push(
            supabase
              .from('test_versions')
              .insert([{
                master_id: selectedGroup[0].master_id, // 같은 마스터 ID 사용
                grade_level: grade,
                system_type: system,
                time_limit_minutes: selectedGroup[0].time_limit_minutes // 기존 시간 제한 유지
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

      toast({
        title: "성공",
        description: "학년별 버전이 수정되었습니다."
      });

      setShowEditGrades(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating version grades:', error);
      toast({
        title: "오류",
        description: "학년별 버전 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <Card key={`group-${group.groupNumber}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>학년별 버전 그룹 {group.groupNumber}</span>
              <Badge variant="outline" className="text-sm">
                {group.versions.length}개 학년
              </Badge>
            </CardTitle>
            <CardDescription>
              생성일: {new Date(group.versions[0].created_at).toLocaleDateString()} • 선택된 학년들이 같은 문제를 공유합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 버전 통계 배지 */}
              <div className="flex items-center justify-between">
                <VersionStatsBadges stats={group.stats} size="sm" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.entries(group.systemGrades).map(([system, grades]) => (
                  <div key={system} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {system}제
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {grades.map((grade, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {grade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-end pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      onVersionSelect?.(group.versions[0]);
                      // 상위 컴포넌트에서 통계 로드를 위해 콜백 호출
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    문제 관리
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    미리보기
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleEditGrades(group.versions)}
                  >
                    <Edit className="h-4 w-4" />
                    학년 수정
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteGroup(group.versions)}
                  >
                    <Trash2 className="h-4 w-4" />
                    그룹 삭제
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* 학년 수정 다이얼로그 */}
      <Dialog open={showEditGrades} onOpenChange={setShowEditGrades}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>학년별 버전 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>시스템 종류 (다중 선택 가능)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 p-3 border rounded-md">
                {SYSTEMS.map((system) => (
                  <div key={system} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-system-${system}`}
                      checked={editForm.selectedSystems.includes(system)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditForm(prev => ({
                            ...prev,
                            selectedSystems: [...prev.selectedSystems, system]
                          }));
                        } else {
                          setEditForm(prev => ({
                            ...prev,
                            selectedSystems: prev.selectedSystems.filter(s => s !== system),
                            selectedGradesBySystem: {
                              ...prev.selectedGradesBySystem,
                              [system]: []
                            }
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`edit-system-${system}`} className="text-sm font-normal cursor-pointer">
                      {system}제
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {editForm.selectedSystems.map((system) => (
              <div key={system}>
                <Label>{system}제 학년 선택</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                  {SYSTEM_GRADES[system as keyof typeof SYSTEM_GRADES]?.map((grade) => (
                    <div key={`edit-${system}-${grade}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${system}-${grade}`}
                        checked={editForm.selectedGradesBySystem[system]?.includes(grade) || false}
                        onCheckedChange={(checked) => {
                          const currentGrades = editForm.selectedGradesBySystem[system] || [];
                          if (checked) {
                            setEditForm(prev => ({
                              ...prev,
                              selectedGradesBySystem: {
                                ...prev.selectedGradesBySystem,
                                [system]: [...currentGrades, grade]
                              }
                            }));
                          } else {
                            setEditForm(prev => ({
                              ...prev,
                              selectedGradesBySystem: {
                                ...prev.selectedGradesBySystem,
                                [system]: currentGrades.filter(g => g !== grade)
                              }
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`edit-${system}-${grade}`} className="text-sm font-normal cursor-pointer">
                        {grade}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* 수정될 버전 미리보기 */}
            {editForm.selectedSystems.length > 0 && (
              <div>
                <Label className="text-sm font-medium">수정될 버전 미리보기</Label>
                <div className="mt-2 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                  {editForm.selectedSystems.map((system) => {
                    const grades = editForm.selectedGradesBySystem[system] || [];
                    return grades.map((grade) => (
                      <div key={`preview-${system}-${grade}`} className="text-sm text-muted-foreground">
                        • {system}제 - {grade}
                      </div>
                    ));
                  })}
                  {editForm.selectedSystems.every(system => 
                    !editForm.selectedGradesBySystem[system]?.length
                  ) && (
                    <div className="text-sm text-muted-foreground">
                      학년을 선택해주세요
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditGrades(false)}>
                취소
              </Button>
              <Button 
                onClick={updateVersionGrades}
                disabled={editForm.selectedSystems.every(system => 
                  !editForm.selectedGradesBySystem[system]?.length
                )}
              >
                수정 완료
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}