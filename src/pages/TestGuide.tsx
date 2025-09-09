import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users, FileText, Headphones, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ContactButton from "@/components/ContactButton";

const TestGuide = () => {
  const navigate = useNavigate();

  const testTypes = [
    {
      title: "수학 진단평가",
      description: "초등~고등 수학 실력을 정확히 진단",
      duration: "45분",
      questions: "30문항",
      icon: FileText,
      features: ["적응형 출제", "상세 분석", "학습 로드맵 제공"]
    },
    {
      title: "영어 진단평가", 
      description: "읽기, 듣기, 문법 종합 평가",
      duration: "40분",
      questions: "35문항",
      icon: Headphones,
      features: ["듣기 평가 포함", "단계별 진단", "맞춤 커리큘럼"]
    },
    {
      title: "국어 진단평가",
      description: "문해력과 어휘력 종합 측정",
      duration: "35분", 
      questions: "25문항",
      icon: FileText,
      features: ["문해력 진단", "어휘 수준 측정", "읽기 능력 분석"]
    }
  ];

  const steps = [
    {
      step: 1,
      title: "테스트 선택",
      description: "평가받고 싶은 과목과 학년을 선택합니다."
    },
    {
      step: 2,
      title: "환경 확인",
      description: "조용한 환경에서 집중할 수 있는 공간을 준비합니다."
    },
    {
      step: 3,
      title: "테스트 진행",
      description: "문제를 차근차근 읽고 정확하게 답변합니다."
    },
    {
      step: 4,
      title: "결과 확인",
      description: "상세한 분석 결과와 학습 추천사항을 확인합니다."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            테스트 안내
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            정확한 학습 진단을 위한 온라인 평가 시스템입니다.
            <br />
            체계적인 진단으로 개인별 맞춤 학습 방향을 제시합니다.
          </p>
        </div>

        {/* Test Types */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">평가 과목</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testTypes.map((test, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <test.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {test.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {test.questions}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {test.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">진행 과정</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  {step.step}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              테스트 전 확인사항
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">기술적 요구사항</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 안정적인 인터넷 연결</li>
                  <li>• 최신 브라우저 (Chrome, Safari, Firefox)</li>
                  <li>• 스피커 또는 이어폰 (영어 듣기평가)</li>
                  <li>• 화면 해상도 1024x768 이상</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">환경 및 준비사항</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 조용하고 집중할 수 있는 환경</li>
                  <li>• 충분한 시간 확보</li>
                  <li>• 필기구 준비 (계산용)</li>
                  <li>• 중간 저장 불가, 한 번에 완료</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            variant="academy"
            onClick={() => navigate("/test/select")}
            className="px-8 py-6 text-lg"
          >
            테스트 시작하기
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            약 30-45분 소요 | 무료 진단 | 즉시 결과 확인
          </p>
        </div>
      </div>

      <ContactButton />
    </div>
  );
};

export default TestGuide;