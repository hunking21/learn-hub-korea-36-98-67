import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface MockTest {
  id: string;
  title: string;
  subject: string;
  durationMin: number;
  available: boolean;
}

const mockTests: MockTest[] = [
  { id: 'rv1', title: '리딩 진단 1', subject: 'Reading', durationMin: 30, available: true },
  { id: 'ma1', title: '수학 레벨테스트', subject: 'Math', durationMin: 40, available: true },
  { id: 'en1', title: '영어 문법 평가', subject: 'English', durationMin: 25, available: false },
];

const StudentTests = () => {
  const navigate = useNavigate();

  const handleStartTest = (testId: string) => {
    navigate(`/student/tests/start/${testId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">시험 목록/응시</h1>
        <p className="text-muted-foreground mt-2">
          응시 가능한 시험을 확인하고 응시하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>응시 가능한 시험</CardTitle>
          <CardDescription>
            현재 응시할 수 있는 시험 목록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시험명</TableHead>
                  <TableHead>과목</TableHead>
                  <TableHead>소요시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell>{test.subject}</TableCell>
                    <TableCell>{test.durationMin}분</TableCell>
                    <TableCell>
                      {test.available ? (
                        <Badge variant="default">응시 가능</Badge>
                      ) : (
                        <Badge variant="secondary">마감</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={!test.available}
                        onClick={() => handleStartTest(test.id)}
                      >
                        응시하기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {mockTests.map((test) => (
              <Card key={test.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{test.title}</h3>
                      <p className="text-sm text-muted-foreground">{test.subject}</p>
                    </div>
                    {test.available ? (
                      <Badge variant="default">응시 가능</Badge>
                    ) : (
                      <Badge variant="secondary">마감</Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      소요시간: {test.durationMin}분
                    </span>
                    <Button
                      size="sm"
                      disabled={!test.available}
                      onClick={() => handleStartTest(test.id)}
                    >
                      응시하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTests;