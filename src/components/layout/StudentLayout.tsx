import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  BarChart3, 
  Bell, 
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { AUTH_MODE } from '@/config/authMode';

const StudentLayout = () => {
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
      if (session.role !== 'student') {
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
        return { username: session.username, role: 'student' };
      }
    }
    return { username: 'student', role: 'student' };
  };

  const userInfo = getUserInfo();

  const menuItems = [
    {
      label: '시험 목록/응시하기',
      path: '/student/tests',
      icon: BookOpen,
    },
    {
      label: '결과 확인',
      path: '/student/results',
      icon: BarChart3,
    },
    {
      label: '설정',
      path: '/student/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">TN Academy Student</h1>
          
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
                <Link
                  key={item.path}
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

export default StudentLayout;