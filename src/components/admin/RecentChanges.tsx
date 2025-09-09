import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ExternalLink } from 'lucide-react';
import { changelogManager } from '@/utils/changelogUtils';
import type { ChangelogEntry } from '@/types/changelog';

interface RecentChangesProps {
  limit?: number;
  showHeader?: boolean;
}

export function RecentChanges({ limit = 10, showHeader = true }: RecentChangesProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    const updateEntries = () => {
      setEntries(changelogManager.getRecentEntries(limit));
    };

    updateEntries();
    const unsubscribe = changelogManager.subscribe(updateEntries);
    return unsubscribe;
  }, [limit]);

  const getAreaKorean = (area: string): string => {
    const mapping: Record<string, string> = {
      tests: '시험',
      versions: '버전',
      sections: '섹션',
      questions: '문항',
      assignments: '배정',
      settings: '설정',
      students: '학생',
      tokens: '토큰',
      backup: '백업',
    };
    return mapping[area] || area;
  };

  const getActionKorean = (action: string): string => {
    const mapping: Record<string, string> = {
      create: '생성',
      update: '수정',
      delete: '삭제',
      publish: '발행',
      import: '가져오기',
      export: '내보내기',
      deploy: '배포',
      restore: '복원',
    };
    return mapping[action] || action;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      publish: 'default',
      import: 'outline',
      export: 'outline',
      deploy: 'default',
      restore: 'secondary',
    };
    return colors[action] || 'secondary';
  };

  const formatTimeAgo = (isoString: string): string => {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            최근 변경사항
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/changelog">
              <ExternalLink className="h-4 w-4 mr-2" />
              전체 보기
            </a>
          </Button>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {entries.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              변경 기록이 없습니다.
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getActionColor(entry.action) as any}
                          className="text-xs"
                        >
                          {getAreaKorean(entry.area)}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className="text-xs"
                        >
                          {getActionKorean(entry.action)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm font-medium text-foreground">
                        {entry.summary}
                      </p>
                      
                      {entry.details && (
                        <p className="text-xs text-muted-foreground">
                          {entry.details}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-right">
                      <div>{formatTimeAgo(entry.at)}</div>
                      <div className="text-xs opacity-70">
                        {new Date(entry.at).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}