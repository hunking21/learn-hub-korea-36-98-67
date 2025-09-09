import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  backPath?: string;
}

const AppLayout = ({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false, 
  showHomeButton = true,
  backPath 
}: AppLayoutProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      {(showBackButton || showHomeButton || title) && (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {showBackButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    뒤로가기
                  </Button>
                )}
                {title && (
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                    {subtitle && (
                      <p className="text-sm text-muted-foreground">{subtitle}</p>
                    )}
                  </div>
                )}
              </div>
              {showHomeButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  홈으로
                </Button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;