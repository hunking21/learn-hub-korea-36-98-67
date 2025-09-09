import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProctorMonitoring } from "@/hooks/useProctorMonitoring";
import { RefreshCw, Eye, AlertTriangle, Clock, Users, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeRemaining = (seconds: number) => {
  if (seconds <= 0) return "시간 초과";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

export default function ProctorMonitoring() {
  const { attempts, selectedAttempt, setSelectedAttempt, isLoading, refresh } = useProctorMonitoring();

  const getSystemGradeDisplay = (attempt: any) => {
    if (!attempt.version) return "정보 없음";
    return `${attempt.version.system} / ${attempt.version.grade}`;
  };

  const getCurrentSectionInfo = (attempt: any) => {
    if (!attempt.resume || !attempt.version) {
      return { sectionName: "시작 대기", questionInfo: "" };
    }

    const section = attempt.version.sections?.[attempt.resume.sectionIndex];
    if (!section) {
      return { sectionName: "알 수 없음", questionInfo: "" };
    }

    const currentQuestionNum = attempt.resume.questionIndex + 1;
    const totalQuestions = section.questions?.length || 0;

    return {
      sectionName: section.label || section.type,
      questionInfo: `${currentQuestionNum}/${totalQuestions}`
    };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">라이브 모니터</h1>
            <p className="text-muted-foreground mt-2">
              진행 중인 시험을 실시간으로 모니터링합니다
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {attempts.length}명 응시 중
            </Badge>
            <Button 
              onClick={refresh} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 진행 중인 시험 목록 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  진행 중인 시험
                  <Badge className="ml-2">{attempts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    데이터 로딩 중...
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    현재 진행 중인 시험이 없습니다
                  </div>
                ) : (
                  <div className="overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>시도 ID</TableHead>
                            <TableHead>시험/버전</TableHead>
                            <TableHead>System/Grade</TableHead>
                            <TableHead>잠금모드</TableHead>
                            <TableHead>시작시각</TableHead>
                            <TableHead>남은시간</TableHead>
                            <TableHead>이탈횟수</TableHead>
                            <TableHead>마지막활동</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {attempts.map((attempt) => (
                          <TableRow
                            key={attempt.id}
                            className={`cursor-pointer transition-colors ${
                              selectedAttempt?.id === attempt.id 
                                ? 'bg-muted/50 border-l-4 border-l-primary' 
                                : 'hover:bg-muted/30'
                            }`}
                            onClick={() => setSelectedAttempt(attempt)}
                          >
                            <TableCell className="font-mono text-sm">
                              {attempt.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{attempt.test?.name || '알 수 없음'}</div>
                                <div className="text-xs text-muted-foreground">
                                  v{attempt.version?.id.slice(0, 8) || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getSystemGradeDisplay(attempt)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {attempt.isLockdownMode ? (
                                <div className="flex items-center gap-1">
                                  <Shield className="w-4 h-4 text-orange-600" />
                                  <Badge variant="secondary" className="text-xs">
                                    활성
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  비활성
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDistanceToNow(new Date(attempt.startedAt), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </TableCell>
                            <TableCell>
                              <div className={`font-mono text-sm ${
                                attempt.remainingTime <= 300 
                                  ? 'text-destructive font-bold' 
                                  : attempt.remainingTime <= 900 
                                    ? 'text-orange-600' 
                                    : 'text-foreground'
                              }`}>
                                {formatTimeRemaining(attempt.remainingTime)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {attempt.violationCount > 0 && (
                                  <AlertTriangle className="w-4 h-4 text-destructive" />
                                )}
                                <span className={attempt.violationCount > 0 ? 'text-destructive font-bold' : ''}>
                                  {attempt.violationCount}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDistanceToNow(new Date(attempt.lastActivity), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 상세 정보 패널 */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  상세 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAttempt ? (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                       {/* 기본 정보 */}
                       <div className="space-y-2">
                         <h4 className="font-semibold text-foreground">시험 정보</h4>
                         <div className="space-y-2 text-sm">
                           <div>
                             <span className="font-medium">시험명:</span>
                             <div className="mt-1 p-2 bg-muted rounded">
                               {selectedAttempt.test?.name || '알 수 없음'}
                             </div>
                           </div>
                           <div>
                             <span className="font-medium">System/Grade:</span>
                             <Badge variant="outline" className="ml-2">
                               {getSystemGradeDisplay(selectedAttempt)}
                             </Badge>
                           </div>
                           <div>
                             <span className="font-medium">잠금 모드:</span>
                             {selectedAttempt.isLockdownMode ? (
                               <div className="mt-1 flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                                 <Shield className="w-4 h-4 text-orange-600" />
                                 <span className="text-orange-800 font-medium">활성화됨</span>
                               </div>
                             ) : (
                               <div className="mt-1 p-2 bg-muted rounded">
                                 비활성화됨
                               </div>
                             )}
                           </div>
                           <div>
                             <span className="font-medium">시도 ID:</span>
                             <div className="mt-1 font-mono text-xs bg-muted p-2 rounded">
                               {selectedAttempt.id}
                             </div>
                           </div>
                         </div>
                       </div>

                      <Separator />

                      {/* 진행 상황 */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">진행 상황</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">현재 위치:</span>
                            <div className="mt-1 p-2 bg-muted rounded">
                              {(() => {
                                const info = getCurrentSectionInfo(selectedAttempt);
                                return (
                                  <div>
                                    <div className="font-medium">{info.sectionName}</div>
                                    {info.questionInfo && (
                                      <div className="text-xs text-muted-foreground">
                                        문제 {info.questionInfo}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">경과 시간:</span>
                            <div className="mt-1 font-mono bg-muted p-2 rounded">
                              {formatTime(selectedAttempt.elapsedTime)}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">남은 시간:</span>
                            <div className={`mt-1 font-mono p-2 rounded ${
                              selectedAttempt.remainingTime <= 300 
                                ? 'bg-destructive/10 text-destructive' 
                                : 'bg-muted'
                            }`}>
                              {formatTimeRemaining(selectedAttempt.remainingTime)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 이탈 기록 */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          이탈 기록
                          <Badge variant={selectedAttempt.violationCount > 0 ? "destructive" : "secondary"}>
                            {selectedAttempt.violationCount}건
                          </Badge>
                        </h4>
                        
                        {selectedAttempt.violations && selectedAttempt.violations.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedAttempt.violations.map((violation, index) => (
                              <div key={index} className="p-2 bg-destructive/5 border border-destructive/20 rounded text-sm">
                                <div className="flex justify-between items-center">
                                  <Badge variant="destructive" className="text-xs">
                                    {violation.type === 'blur' ? '포커스 이탈' : '페이지 숨김'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(violation.at), { 
                                      addSuffix: true, 
                                      locale: ko 
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground p-4 text-center bg-muted/30 rounded">
                            이탈 기록이 없습니다
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* 최근 활동 */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">최근 활동</h4>
                        <div className="text-sm">
                          <span className="font-medium">마지막 활동:</span>
                          <div className="mt-1 p-2 bg-muted rounded">
                            {formatDistanceToNow(new Date(selectedAttempt.lastActivity), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>시험을 선택하여<br />상세 정보를 확인하세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}