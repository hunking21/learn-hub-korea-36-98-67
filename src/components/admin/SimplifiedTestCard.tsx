import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Play, Send, Trash2, Plus } from "lucide-react";
import { TestTargetChips } from "./TestTargetChips";
import { VersionStatsBadges } from "@/components/ui/version-stats-badges";
import { calculateMemoryVersionStats } from "@/utils/testVersionStats";
import { memoryRepo } from "@/repositories/memoryRepo";
import { useToast } from "@/hooks/use-toast";
import type { Test } from "@/types";
import { cn } from "@/lib/utils";

interface SimplifiedTestCardProps {
  test: Test;
  onEdit: (test: Test) => void;
  onPreview: (test: Test) => void;
  onDeploy: (test: Test) => void;
  onClick: (test: Test) => void;
  onTestUpdated: () => void;
}

export function SimplifiedTestCard({ 
  test, 
  onEdit, 
  onPreview, 
  onDeploy, 
  onClick,
  onTestUpdated 
}: SimplifiedTestCardProps) {
  const { toast } = useToast();

  // 섹션 정보 가져오기
  const getSectionChips = () => {
    if (!test.versions?.[0]?.sections || test.versions[0].sections.length === 0) {
      return [];
    }
    
    return test.versions[0].sections.map(section => ({
      label: section.label,
      timeLimit: section.timeLimit
    }));
  };

  const sectionChips = getSectionChips();
  const maxVisibleChips = 3;
  const hasMoreSections = sectionChips.length > maxVisibleChips;
  const visibleSections = sectionChips.slice(0, maxVisibleChips);
  const hiddenCount = sectionChips.length - maxVisibleChips;

  // 시험 삭제 확인 및 실행
  const handleDelete = async () => {
    try {
      // TODO: attempts 체크 로직 추가 (현재는 memoryRepo에서 attempts 데이터 없음)
      // const hasAttempts = await memoryRepo.checkTestAttempts(test.id);
      // if (hasAttempts) {
      //   toast({
      //     title: "삭제 불가",
      //     description: "이미 시험 응시 기록이 있어 삭제할 수 없습니다.",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      await memoryRepo.deleteTest(test.id);
      onTestUpdated();
      
      toast({
        title: "시험 삭제",
        description: "시험이 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      console.error('시험 삭제 실패:', error);
      toast({
        title: "삭제 실패",
        description: "시험 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 전체 시험 통계 계산
  const allStats = {
    sectionCount: 0,
    questionCount: 0,
    totalPoints: 0,
    totalTimeMinutes: 0
  };

  if (test.versions) {
    test.versions.forEach(version => {
      const stats = calculateMemoryVersionStats(version);
      allStats.sectionCount += stats.sectionCount;
      allStats.questionCount += stats.questionCount;
      allStats.totalPoints += stats.totalPoints;
      allStats.totalTimeMinutes += stats.totalTimeMinutes;
    });
  }

  const isDraft = test.status === 'Draft';
  const isPublished = test.status === 'Published';
  
  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => onClick(test)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-tight">
                {test.name}
              </h3>
              <Badge 
                variant={isPublished ? 'default' : 'secondary'}
                className={cn(
                  "text-xs",
                  isPublished && "bg-green-100 text-green-800 hover:bg-green-100"
                )}
              >
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            
            <TestTargetChips versions={test.versions || []} />
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(test);
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>시험 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 "{test.name}" 시험을 삭제하시겠습니까? 
                    이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 함께 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(test);
              }}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Play className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDeploy(test);
              }}
              disabled={isDraft}
              className={cn(
                "transition-colors",
                isDraft 
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* 섹션 미리보기 */}
        {sectionChips.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            {visibleSections.map((section, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(test); // 섹션 편집을 위해 편집 화면으로 이동
                }}
              >
                {section.label} {section.timeLimit}′
              </Badge>
            ))}
            {hasMoreSections && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(test);
                }}
              >
                +{hiddenCount}
              </Badge>
            )}
          </div>
        )}
        
        <VersionStatsBadges 
          stats={allStats}
          size="sm" 
          variant="outline"
          className="text-muted-foreground"
        />
      </CardContent>
    </Card>
  );
}