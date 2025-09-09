import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";

const useQuery = () => new URLSearchParams(useLocation().search);

const TestStart = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const system = query.get("system");
  const grade = query.get("grade");
  const exam = query.get("exam");

  const systemLabel =
    system === "korea" ? "한국 학년제" :
    system === "us" ? "미국 학년제 (12학년제)" :
    system === "uk" ? "영국 학년제 (13학년제)" :
    "미선택";
  useEffect(() => {
    document.title = "온라인 테스트 시작 | 학년·시험 선택";

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "온라인 테스트 시작: 학년과 시험을 선택하고 맞춤 진단을 시작하세요."
    );

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);
  }, []);

  return (
    <AppLayout 
      title="온라인 테스트 시작"
      subtitle="선택 내용을 확인하고 테스트를 진행하세요"
      showBackButton={true}
    >
      <section className="bg-card rounded-lg p-6 border">
        <div className="grid md:grid-cols-3 gap-6">
          <article>
            <h2 className="text-sm font-medium text-academy-muted mb-2">선택한 학년제</h2>
            <p className="text-xl font-semibold text-academy-brown">{systemLabel}</p>
          </article>
          <article>
            <h2 className="text-sm font-medium text-academy-muted mb-2">선택한 학년</h2>
            <p className="text-xl font-semibold text-academy-brown">{grade ?? "미선택"}</p>
          </article>
          <article>
            <h2 className="text-sm font-medium text-academy-muted mb-2">선택한 시험</h2>
            <p className="text-xl font-semibold text-academy-brown">{exam ?? "미선택"}</p>
          </article>
        </div>

        {exam === "진단테스트" && (
          <section className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-4">📝 진단테스트 구성 안내</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-800 mb-3">시험 구성</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">📖 Reading (리딩)</span>
                    <span className="text-blue-600 font-semibold">50분</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">✍️ Writing (라이팅)</span>
                    <span className="text-blue-600 font-semibold">20분</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">🗣️ Speaking (스피킹)</span>
                    <span className="text-blue-600 font-semibold">10분</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">🧮 Math (수학)</span>
                    <span className="text-blue-600 font-semibold">50분</span>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mt-3 font-medium">
                  ⚠️ 모든 문제는 영어로 출제됩니다 (수학 포함)
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-800 mb-3">시험 전 기기 확인</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <span className="text-green-600">🎤</span>
                    <span>마이크가 정상 작동하는지 확인하세요</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <span className="text-green-600">📷</span>
                    <span>카메라가 정상 작동하는지 확인하세요</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <span className="text-green-600">🔊</span>
                    <span>스피커/헤드폰이 정상 작동하는지 확인하세요</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <span className="text-green-600">⌨️</span>
                    <span>키보드 타이핑이 정상 작동하는지 확인하세요</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-3">
                  💡 문제가 있다면 시험 시작 전에 미리 해결해 주세요
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 flex justify-end">
          <Button 
            disabled={!system || !grade || !exam} 
            onClick={() => navigate(`/test/progress?system=${encodeURIComponent(system!)}&grade=${encodeURIComponent(grade!)}&exam=${encodeURIComponent(exam!)}`)}
            size="lg"
          >
            테스트 시작
          </Button>
        </div>
      </section>
    </AppLayout>
  );
};

export default TestStart;
