import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGateProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  fallbackPath?: string;
}

export function AuthGate({ 
  children, 
  requireAdmin = false, 
  requireTeacher = false, 
  fallbackPath = '/login' 
}: AuthGateProps) {
  const { user, profile, loading, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate(fallbackPath, { replace: true });
        return;
      }

      if (requireAdmin && !isAdmin) {
        throw new Error('권한이 없습니다.');
      }

      if (requireTeacher && !isTeacher) {
        throw new Error('권한이 없습니다.');
      }
    }
  }, [loading, user, profile, isAdmin, isTeacher, requireAdmin, requireTeacher, navigate, fallbackPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">권한이 없습니다</h2>
          <p className="text-muted-foreground mt-2">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  if (requireTeacher && !isTeacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">권한이 없습니다</h2>
          <p className="text-muted-foreground mt-2">교사 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}