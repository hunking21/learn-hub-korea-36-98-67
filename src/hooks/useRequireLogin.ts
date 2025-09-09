import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseRequireLoginOptions {
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  fallbackPath?: string;
  onUnauthorized?: () => void;
}

export function useRequireLogin(options: UseRequireLoginOptions = {}) {
  const { 
    requireAdmin = false, 
    requireTeacher = false, 
    fallbackPath = '/login',
    onUnauthorized
  } = options;
  
  const { user, profile, loading, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate(fallbackPath, { replace: true });
        return;
      }

      if (requireAdmin && !isAdmin) {
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          throw new Error('권한이 없습니다.');
        }
        return;
      }

      if (requireTeacher && !isTeacher) {
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          throw new Error('권한이 없습니다.');
        }
        return;
      }
    }
  }, [loading, user, profile, isAdmin, isTeacher, requireAdmin, requireTeacher, navigate, fallbackPath, onUnauthorized]);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !loading && !!user && !!profile,
    hasRequiredPermissions: !loading && !!user && !!profile && 
      (!requireAdmin || isAdmin) && 
      (!requireTeacher || isTeacher)
  };
}