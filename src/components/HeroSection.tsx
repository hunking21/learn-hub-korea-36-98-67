import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";


const HeroSection = () => {
  const navigate = useNavigate();


  return (
    <>
      <section className="bg-gradient-to-br from-academy-cream to-background py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-academy-text mb-6">
            정확한 학습 진단부터,
            <br />
            <span className="text-academy-brown">맞춤 교육까지</span>
          </h1>

          <p className="text-lg md:text-xl text-academy-muted mb-8 max-w-2xl mx-auto leading-relaxed">
            정확한 학습 수준 진단으로 시작하는
            <br />
            개인별 맞춤형 교육 솔루션
          </p>

          <Button variant="academy" size="xl" className="mb-16" onClick={() => navigate("/test/select")}>
            테스트 응시하러 가기
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-academy-brown mb-2">12,000+</div>
              <div className="text-academy-muted font-medium">누적 응시자</div>
            </div>

            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-academy-brown mb-2">99%</div>
              <div className="text-academy-muted font-medium">정확도</div>
            </div>

            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-academy-brown mb-2">24시간</div>
              <div className="text-academy-muted font-medium">언제든지 응시가능</div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export default HeroSection;