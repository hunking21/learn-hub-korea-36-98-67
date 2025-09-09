import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Hash, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VersionStats } from "@/utils/testVersionStats";

interface VersionStatsBadgesProps {
  stats: VersionStats;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "outline";
}

export function VersionStatsBadges({ 
  stats, 
  className,
  size = "default",
  variant = "outline"
}: VersionStatsBadgesProps) {
  const badgeSize = size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3 w-3";
  
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Badge variant={variant} className={cn("gap-1", badgeSize)}>
        <Hash className={iconSize} />
        {stats.sectionCount}개 섹션
      </Badge>
      
      <Badge variant={variant} className={cn("gap-1", badgeSize)}>
        <FileText className={iconSize} />
        {stats.questionCount}개 문항
      </Badge>
      
      {stats.totalPoints > 0 && (
        <Badge variant={variant} className={cn("gap-1", badgeSize)}>
          <Award className={iconSize} />
          {stats.totalPoints}점
        </Badge>
      )}
      
      {stats.totalTimeMinutes > 0 && (
        <Badge variant={variant} className={cn("gap-1", badgeSize)}>
          <Clock className={iconSize} />
          {stats.totalTimeMinutes}분
        </Badge>
      )}
    </div>
  );
}