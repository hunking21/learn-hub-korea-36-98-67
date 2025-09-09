import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import ContactButton from "@/components/ContactButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn, UserPlus, BookOpen, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { StudentTestSeeder } from "@/components/StudentTestSeeder";

const Index = () => {
  const { user, profile, loading } = useAuth();

  const testAdminLogin = async () => {
    try {
      const { data, error } = await supabase.rpc('verify_user_login', {
        p_username: 'admin',
        p_password: 'admin123!',
      });

      if (error) {
        alert('RPC 실패: ' + (error.message || JSON.stringify(error)));
        return;
      }
      if (!Array.isArray(data) || data.length === 0) {
        alert('RPC 응답 비어있음: 아이디/비번 불일치 혹은 함수 호출 문제');
        return;
      }
      alert('RPC 성공! 토큰: ' + data[0].token);
    } catch (err) {
      alert('테스트 실패: ' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <HeroSection />
        
        {!user ? (
          /* Auth Section for non-logged in users */
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-6">시작하기</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="flex items-center gap-2">
                <Link to="/login">
                  <LogIn size={20} />
                  로그인
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
                <Link to="/login">
                  <UserPlus size={20} />
                  회원가입
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              테스트 계정: admin / admin123!, teacher / teacher123!, student / student123!
            </p>
            <Button onClick={testAdminLogin} variant="secondary" size="sm" className="mt-4">
              관리자 RPC 테스트
            </Button>
          </div>
        ) : (
          /* Action Section for logged in users */
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              안녕하세요, {profile?.display_name || user.username}님!
            </h2>
            <p className="text-muted-foreground mb-8">
              오늘도 학습을 시작해보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="flex items-center gap-2">
                <Link to="/test/select">
                  <BookOpen size={20} />
                  테스트 시작
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
                <Link to="/s">
                  <BookOpen size={20} />
                  학생 시험
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
                <Link to="/dashboard">
                  <BarChart3 size={20} />
                  대시보드
                </Link>
              </Button>
            </div>
            
            {/* Development helpers */}
            <div className="mt-8 max-w-md mx-auto">
              <StudentTestSeeder />
            </div>
          </div>
        )}
        
        <Footer />
      </main>
      <ContactButton />
    </div>
  );
};

export default Index;
