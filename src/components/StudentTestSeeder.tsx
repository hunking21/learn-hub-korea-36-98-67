import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { memoryRepo } from "@/repositories/memoryRepo";
import { useToast } from "@/hooks/use-toast";
import { Database, Trash2 } from "lucide-react";

export function StudentTestSeeder() {
  const { toast } = useToast();

  const seedStudentTestData = async () => {
    try {
      // Create a test with published status
      const test = await memoryRepo.createTest({
        name: "영어 진단 평가",
        description: "학생들의 영어 실력을 진단하는 종합 평가입니다."
      });

      // Add a version
      await memoryRepo.addVersion(test.id, {
        targets: [{ system: 'KR', grades: ['초6'] }]
      });

      // Update test status to Published
      await memoryRepo.updateTestStatus(test.id, 'Published');

      // Add assignment
      await memoryRepo.addAssignment(test.id, {
        system: 'KR',
        grades: ['초6', '중1'],
        startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });

      // Create another test
      const test2 = await memoryRepo.createTest({
        name: "수학 진단 테스트",
        description: "수학 기초 실력을 평가합니다."
      });

      await memoryRepo.addVersion(test2.id, {
        targets: [{ system: 'US', grades: ['G6'] }]
      });

      await memoryRepo.updateTestStatus(test2.id, 'Published');

      await memoryRepo.addAssignment(test2.id, {
        system: 'US',
        grades: ['5', '6', '7'],
        startAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      });

      // Create a KR test with grade filtering
      const test3 = await memoryRepo.createTest({
        name: "한국어 읽기 평가",
        description: "한국어 읽기 능력을 평가하는 시험입니다."
      });

      await memoryRepo.addVersion(test3.id, {
        targets: [{ system: 'KR', grades: ['초6'] }]
      });

      await memoryRepo.updateTestStatus(test3.id, 'Published');

      await memoryRepo.addAssignment(test3.id, {
        system: 'KR',
        grades: ['초6'],
        startAt: new Date().toISOString(), // now
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      });

      toast({
        title: "테스트 데이터 생성 완료",
        description: "학생용 샘플 시험과 배정이 생성되었습니다.",
      });
    } catch (error) {
      console.error('Failed to seed student test data:', error);
      toast({
        title: "오류",
        description: "테스트 데이터 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const clearAllData = async () => {
    try {
      const tests = await memoryRepo.listTests();
      for (const test of tests) {
        await memoryRepo.deleteTest(test.id);
      }

      toast({
        title: "데이터 초기화 완료",
        description: "모든 테스트 데이터가 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast({
        title: "오류",
        description: "데이터 초기화에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          학생 테스트 데이터 관리
        </CardTitle>
        <CardDescription>
          학생용 페이지(/s) 테스트를 위한 샘플 데이터를 생성하고 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={seedStudentTestData} className="w-full">
          <Database className="w-4 h-4 mr-2" />
          학생용 샘플 데이터 생성
        </Button>
        <Button onClick={clearAllData} variant="destructive" className="w-full">
          <Trash2 className="w-4 h-4 mr-2" />
          모든 데이터 삭제
        </Button>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• 생성되는 데이터: 발행된 시험 + 배정 정보</p>
          <p>• KR 초6, US 6학년 등 다양한 학제/학년</p>
          <p>• 응시 기간 내 시험들로 구성</p>
        </div>
      </CardContent>
    </Card>
  );
}