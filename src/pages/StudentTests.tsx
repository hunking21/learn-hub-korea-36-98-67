import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, BookOpen, Calendar, Play } from 'lucide-react';
import { memoryRepo } from '@/repositories/memoryRepo';
import type { Test, TestAssignment, TestVersion } from '@/types';
import { useToast } from '@/hooks/use-toast';

const GRADE_OPTIONS = {
  KR: ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'],
  US: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  UK: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
};

interface AvailableAssignment {
  test: Test;
  assignment: TestAssignment;
  version?: TestVersion;
}

export default function StudentTests() {
  const [system, setSystem] = useState<'KR' | 'US' | 'UK'>('KR');
  const [grade, setGrade] = useState('초6');
  const [assignments, setAssignments] = useState<AvailableAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableAssignments();
  }, [system, grade]);

  useEffect(() => {
    // Reset grade when system changes
    if (system === 'KR' && !GRADE_OPTIONS.KR.includes(grade)) {
      setGrade('초6');
    } else if (system === 'US' && !GRADE_OPTIONS.US.includes(grade)) {
      setGrade('6');
    } else if (system === 'UK' && !GRADE_OPTIONS.UK.includes(grade)) {
      setGrade('6');
    }
  }, [system, grade]);

  const loadAvailableAssignments = async () => {
    try {
      setLoading(true);
      const availableAssignments = await memoryRepo.getAvailableAssignments(system, grade);
      setAssignments(availableAssignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast({
        title: "오류",
        description: "시험 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (assignment: AvailableAssignment) => {
    if (!assignment.version) {
      toast({
        title: "오류",
        description: "해당 시험의 버전을 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const attempt = await memoryRepo.createAttempt(assignment.test.id, assignment.version.id);
      navigate(`/s/attempt/${attempt.id}`);
    } catch (error) {
      console.error('Failed to start test:', error);
      toast({
        title: "오류",
        description: "시험 시작에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const formatPeriod = (assignment: TestAssignment) => {
    const start = new Date(assignment.startAt);
    const end = new Date(assignment.endAt);
    const startStr = start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    return `${startStr} ~ ${endStr}`;
  };

  const getRemainingTime = (assignment: TestAssignment) => {
    const now = new Date();
    const end = new Date(assignment.endAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return '마감됨';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}일 남음`;
    if (hours > 0) return `${hours}시간 남음`;
    return '곧 마감';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">응시 가능한 시험</h1>
            <p className="text-muted-foreground">
              학제와 학년을 선택하여 응시 가능한 시험을 확인하세요
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">필터 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">학제</label>
                  <Select value={system} onValueChange={(value: 'KR' | 'US' | 'UK') => setSystem(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="학제를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KR">한국 (KR)</SelectItem>
                      <SelectItem value="US">미국 (US)</SelectItem>
                      <SelectItem value="UK">영국 (UK)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">학년</label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="학년을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS[system].map((gradeOption) => (
                        <SelectItem key={gradeOption} value={gradeOption}>
                          {gradeOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && assignments.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                응시 가능한 시험이 없습니다
              </h2>
              <p className="text-muted-foreground mb-6">
                선택한 학제({system})와 학년({grade})에 배정된 시험이 없거나 응시 기간이 아닙니다.
              </p>
              <div className="text-sm text-muted-foreground">
                다른 학제나 학년을 선택해보세요.
              </div>
            </div>
          )}

          {/* Assignment Cards */}
          {!loading && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map(({ test, assignment, version }) => (
                <Card key={`${test.id}-${assignment.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {test.name}
                      </CardTitle>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        진행 중
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {test.description || '시험 설명이 없습니다'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{version?.grade || assignment.grades.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.system}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatPeriod(assignment)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{getRemainingTime(assignment)}</span>
                      </div>
                    </div>

                    {version?.sections && version.sections.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">시험 구성</div>
                        <div className="flex flex-wrap gap-1">
                          {version.sections.map((section) => (
                            <Badge key={section.id} variant="outline" className="text-xs">
                              {section.label || section.type}
                              <span className="ml-1 opacity-70">({section.timeLimit}분)</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => handleStartTest({ test, assignment, version })}
                      className="w-full"
                      disabled={new Date() > new Date(assignment.endAt)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {new Date() > new Date(assignment.endAt) ? '응시 기간 종료' : '응시 시작'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}