import { Button } from "@/components/ui/button";
import { ChevronDown, User, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, profile, signOut, isAdmin, isTeacher } = useAuth();

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4">
        {/* Top bar: Logo left, actions right */}
        <div className="flex items-center justify-between py-3">
          <a href="/" className="flex items-center" aria-label="TN Academy 홈">
            <img
              src="/lovable-uploads/e99b9adc-93fa-4b4b-9e54-060974d9211a.png"
              alt="TN Academy 로고"
              className="h-10 md:h-12 w-auto"
            />
          </a>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <span className="text-sm font-medium">Language</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            
            {/* 로그인/회원가입 버튼 */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                    내 결과 보기
                  </DropdownMenuItem>
                  {(isAdmin || isTeacher) && (
                    <DropdownMenuItem onClick={() => window.location.href = isAdmin ? '/admin' : '/teacher'}>
                      {isAdmin ? '관리자' : '선생님'} 페이지
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut()}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
                  <LogIn className="h-4 w-4 mr-1" />
                  로그인
                </Button>
                <Button size="sm" onClick={() => window.location.href = '/login'} className="bg-academy-brown hover:bg-academy-brown/90">
                  회원가입
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav: centered menu */}
        <nav aria-label="주요 메뉴" className="border-t border-border">
          <ul className="flex justify-center gap-8 md:gap-14 py-3">
            <li>
              <a href="/test/guide" className="text-foreground/80 hover:text-foreground font-medium transition-colors">테스트 안내</a>
            </li>
            <li>
              <a href="/test/select" className="text-foreground/80 hover:text-foreground font-medium transition-colors">테스트 응시하기</a>
            </li>
            <li>
              <a href="/progress" className="text-foreground/80 hover:text-foreground font-medium transition-colors">진행상황</a>
            </li>
            <li>
              <a href="/dashboard" className="text-foreground/80 hover:text-foreground font-medium transition-colors">내 결과 보기</a>
            </li>
            <li>
              <a href="/faq" className="text-foreground/80 hover:text-foreground font-medium transition-colors">자주하는 질문</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;