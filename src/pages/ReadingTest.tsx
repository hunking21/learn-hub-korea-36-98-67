import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { ReadingTest } from "@/components/reading/ReadingTest";

export default function ReadingTestPage() {
  const { passageId } = useParams<{ passageId: string }>();
  const navigate = useNavigate();

  if (!passageId) {
    return (
      <AppLayout title="오류" showBackButton>
        <div className="text-center py-12">
          <p className="text-muted-foreground">유효하지 않은 지문 ID입니다.</p>
        </div>
      </AppLayout>
    );
  }

  const handleComplete = (sessionId: string) => {
    navigate(`/reading-result/${sessionId}`);
  };

  return (
    <AppLayout title="리딩 테스트" showBackButton>
      <ReadingTest passageId={passageId} onComplete={handleComplete} />
    </AppLayout>
  );
}