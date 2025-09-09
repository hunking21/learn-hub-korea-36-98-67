import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireTeacher?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireTeacher = false 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  
  try {
    const { user, profile, loading, isAdmin, isTeacher, requiresPasswordChange } = useAuth();
    
    console.log('ProtectedRoute 상태:', { 
      user: !!user, 
      profile: profile?.role, 
      loading, 
      isAdmin, 
      isTeacher, 
      requiresPasswordChange,
      requireAdmin,
      requireTeacher 
    });

    // Redirect to change password if required
    useEffect(() => {
      if (user && profile && requiresPasswordChange && window.location.pathname !== '/change-password') {
        navigate('/change-password');
      }
    }, [user, profile, requiresPasswordChange, navigate]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user || !profile) {
      return <LoginForm />;
    }

    if (requireAdmin && !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">접근 권한이 없습니다</h1>
            <p className="text-muted-foreground">관리자만 접근할 수 있는 페이지입니다.</p>
          </div>
        </div>
      );
    }

    if (requireTeacher && !isTeacher) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">접근 권한이 없습니다</h1>
            <p className="text-muted-foreground">선생님 또는 관리자만 접근할 수 있는 페이지입니다.</p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  } catch (error) {
    console.error('ProtectedRoute error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">오류가 발생했습니다</h1>
          <p className="text-muted-foreground">인증 시스템에 문제가 있습니다. 페이지를 새로고침해주세요.</p>
        </div>
      </div>
    );
  }
}