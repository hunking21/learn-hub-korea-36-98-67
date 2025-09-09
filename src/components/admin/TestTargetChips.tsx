import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Version } from "@/types/schema";
import { formatTargets, normalizeVersion } from "@/utils/versionHelpers";

interface TestTargetChipsProps {
  versions: Version[];
  className?: string;
}

export function TestTargetChips({ versions, className }: TestTargetChipsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!versions || versions.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        버전 없음
      </div>
    );
  }

  // Collect all unique targets from all versions
  const allTargets = versions.flatMap(version => {
    const normalized = normalizeVersion(version);
    return normalized.targets || [];
  });

  // Remove duplicate targets and format
  const uniqueTargetsMap = new Map();
  allTargets.forEach(target => {
    const key = target.system;
    const existing = uniqueTargetsMap.get(key);
    if (existing) {
      // Merge grades and remove duplicates
      const mergedGrades = Array.from(new Set([...existing.grades, ...target.grades]));
      uniqueTargetsMap.set(key, { ...target, grades: mergedGrades });
    } else {
      uniqueTargetsMap.set(key, target);
    }
  });

  const uniqueTargets = Array.from(uniqueTargetsMap.values());
  const targetText = formatTargets(uniqueTargets);

  const shouldTruncate = targetText.length > 30;
  const displayText = shouldTruncate && !isExpanded 
    ? targetText.substring(0, 25) + '...' 
    : targetText;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          {displayText}
        </span>
        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </div>
  );
}