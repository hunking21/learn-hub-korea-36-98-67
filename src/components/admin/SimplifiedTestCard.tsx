import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Play, Send } from "lucide-react";
import { TestTargetChips } from "./TestTargetChips";
import { VersionStatsBadges } from "@/components/ui/version-stats-badges";
import { calculateMemoryVersionStats } from "@/utils/testVersionStats";
import type { Test } from "@/types";
import { cn } from "@/lib/utils";

interface SimplifiedTestCardProps {
  test: Test;
  onEdit: (test: Test) => void;
  onPreview: (test: Test) => void;
  onDeploy: (test: Test) => void;
  onClick: (test: Test) => void;
}

export function SimplifiedTestCard({ 
  test, 
  onEdit, 
  onPreview, 
  onDeploy, 
  onClick 
}: SimplifiedTestCardProps) {
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
      
      <CardContent className="pt-0">
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