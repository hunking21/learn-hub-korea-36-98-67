import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TestStart = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleStartExam = () => {
    navigate(`/student/exam/${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">시험 시작 준비</h1>
        <p className="text-muted-foreground mt-2">
          시험을 시작하기 전 준비 사항을 확인하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시험 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            선택 시험 ID: <span className="font-mono font-bold">{id}</span> (모의)
          </p>
          <Button onClick={handleStartExam} className="w-full">
            시작하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestStart;