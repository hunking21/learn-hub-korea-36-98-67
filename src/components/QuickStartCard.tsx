import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Target } from "lucide-react";

const QuickStartCard = () => {
  const navigate = useNavigate();

  const quickOptions = [
    {
      title: "한국 초등학생",
      description: "초등 3~6학년 대상 기본 진단",
      grade: "초5",
      system: "korea",
      testType: "진단고사",
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      textColor: "text-blue-700"
    },
    {
      title: "한국 중학생", 
      description: "중학 1~3학년 대상 종합 진단",
      grade: "중2",
      system: "korea", 
      testType: "진단고사",
      icon: <Target className="h-5 w-5" />,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      textColor: "text-green-700"
    },
    {
      title: "국제학교/해외",
      description: "Grade 6~12 SSAT 준비",
      grade: "Grade 8", 
      system: "us",
      testType: "SSAT",
      icon: <Clock className="h-5 w-5" />,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100", 
      textColor: "text-purple-700"
    }
  ];

  const handleQuickStart = (option: any) => {
    if (option.testType === "진단고사") {
      navigate(`/test/diagnostic?system=${encodeURIComponent(option.system)}&grade=${encodeURIComponent(option.grade)}`);
    } else {
      navigate(`/test/start?system=${encodeURIComponent(option.system)}&grade=${encodeURIComponent(option.grade)}&exam=${encodeURIComponent(option.testType)}`);
    }
  };

  return (
    <section className="py-12 bg-gradient-to-br from-background to-muted/30" id="quick-start">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-academy-text mb-3">
            빠른 시작하기
          </h2>
          <p className="text-academy-muted max-w-2xl mx-auto">
            가장 많이 선택되는 옵션으로 바로 테스트를 시작하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickOptions.map((option, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${option.color}`}
              onClick={() => handleQuickStart(option)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-white/80 ${option.textColor}`}>
                    {option.icon}
                  </div>
                  <Badge variant="secondary" className="bg-white/80">
                    인기
                  </Badge>
                </div>
                <CardTitle className={`text-lg ${option.textColor}`}>
                  {option.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {option.grade} • {option.testType}
                  </div>
                  <Button size="sm" variant="ghost" className={`${option.textColor} hover:bg-white/80`}>
                    시작 →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/test/select")}
            className="border-academy-brown/30 text-academy-muted hover:bg-academy-brown/5"
          >
            또는 상세 옵션 선택하기
          </Button>
        </div>
      </div>
    </section>
  );
};

export default QuickStartCard;