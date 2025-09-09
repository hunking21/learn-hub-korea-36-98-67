import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  BarChart3, 
  Users, 
  Settings,
  FileEdit,
  LogOut,
  User,
  Scan
} from 'lucide-react';
import { AUTH_MODE } from '@/config/authMode';
import { getTeacherPerm } from '@/utils/mockPerms';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (AUTH_MODE === 'mock') {
      const mockSession = localStorage.getItem('mock_session');
      if (!mockSession) {
        navigate('/');
        return;
      }
      
      const session = JSON.parse(mockSession);
      if (session.role !== 'teacher') {
        navigate('/');
        return;
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    if (AUTH_MODE === 'mock') {
      localStorage.removeItem('mock_session');
    } else {
      localStorage.removeItem('session_token');
    }
    navigate('/');
  };

  const getUserInfo = () => {
    if (AUTH_MODE === 'mock') {
      const mockSession = localStorage.getItem('mock_session');
      if (mockSession) {
        const session = JSON.parse(mockSession);
        return { username: session.username, role: 'teacher' };
      }
    }
    return { username: 'teacher', role: 'teacher' };
  };

  const userInfo = getUserInfo();
  const teacherPerms = getTeacherPerm(userInfo.username);

  const menuItems = [
    {
      label: '내 강의실',
      path: '/teacher/classes',
      icon: BookOpen,
    },
    {
      label: '시험 채점',
      path: '/teacher/grading',
      icon: BarChart3,
    },
    {
      label: '시험 리뷰',
      path: '/teacher/review',
      icon: FileEdit,
    },
    {
      label: '오프라인 채점',
      path: '/teacher/offline-grading',
      icon: Scan,
    },
    {
      label: '시험 분석',
      path: '/teacher/analysis',
      icon: BarChart3,
    },
    {
      label: '학생 관리(제한됨)',
      path: '/teacher/students',
      icon: Users,
      disabled: true,
      badge: '관리자 승인 필요',
    },
    {
      label: '문제은행(편집)',
      path: '/teacher/question-bank',
      icon: FileEdit,
      disabled: !teacherPerms.canCreateQuestions,
      badge: !teacherPerms.canCreateQuestions ? '관리자 승인 필요' : undefined,
    },
    {
      label: '설정',
      path: '/teacher/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">TN Academy Teacher</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{userInfo.username}</span>
              <Badge variant="secondary" className="text-xs">
                {userInfo.role}
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <div key={item.path} className="relative">
                  {item.disabled ? (
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-muted-foreground cursor-not-allowed opacity-60`}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;