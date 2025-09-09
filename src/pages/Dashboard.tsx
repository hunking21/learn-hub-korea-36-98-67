import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCog, Users, BookOpen, BarChart3, GraduationCap, ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      // 역할에 따라 자동으로 대시보드 리다이렉트
      switch (profile.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'student':
          // 학생은 현재 페이지에 머물러 시험 선택 화면 표시
          break;
        default:
          break;
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 학생용 대시보드
  if (profile?.role === 'student') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                안녕하세요, {profile.display_name}님!
              </h1>
              <p className="text-muted-foreground">
                오늘도 학습을 시작해보세요
              </p>
            </div>

            <div className="flex justify-center">
              <Card className="hover:shadow-lg transition-shadow max-w-md w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    시험 응시
                  </CardTitle>
                  <CardDescription>
                    배정받은 시험을 확인하고 응시하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate('/student/tests')} 
                    className="w-full"
                  >
                    시험 목록 보기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 기타 역할의 경우 (리다이렉트가 아직 안 된 경우)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}