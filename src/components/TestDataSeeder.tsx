
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedCategory3Data } from "@/utils/seedCategory3Data";
import { seedCategory4Data } from "@/utils/seedCategory4Data";
import { seedAllCategoriesData } from "@/utils/seedAllCategoriesData";
import { toast } from "sonner";

const TestDataSeeder = () => {
  const [loading, setLoading] = useState(false);

  const handleSeedAll = async () => {
    setLoading(true);
    try {
      await seedAllCategoriesData();
      toast.success("모든 카테고리 테스트 데이터가 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("데이터 시드 오류:", error);
      toast.error("테스트 데이터 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedCategory = async (category: number) => {
    setLoading(true);
    try {
      switch (category) {
        case 3:
          await seedCategory3Data();
          break;
        case 4:
          await seedCategory4Data();
          break;
        default:
          throw new Error(`카테고리 ${category}는 현재 지원되지 않습니다.`);
      }
      toast.success(`카테고리 ${category} 테스트 데이터가 성공적으로 생성되었습니다!`);
    } catch (error) {
      console.error(`카테고리 ${category} 데이터 시드 오류:`, error);
      toast.error(`카테고리 ${category} 테스트 데이터 생성 중 오류가 발생했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTestPasswords = () => {
    toast.info("비밀번호 재설정은 관리자 페이지 > 선생님 관리에서 개별적으로 수행할 수 있습니다.");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>테스트 데이터 생성</CardTitle>
        <CardDescription>
          카테고리별 샘플 문제 데이터를 데이터베이스에 추가합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleSeedAll}
          disabled={loading}
          className="w-full"
          variant="default"
        >
          {loading ? "생성 중..." : "모든 카테고리 데이터 생성"}
        </Button>
        
        <Button 
          onClick={handleResetTestPasswords}
          className="w-full"
          variant="secondary"
        >
          비밀번호 재설정 안내
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          {[3, 4].map((category) => (
            <Button
              key={category}
              onClick={() => handleSeedCategory(category)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              카테고리 {category}
            </Button>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• 카테고리 3: 영어 작문 문제</p>
          <p>• 카테고리 4: 스피킹 및 기타 과목</p>
          <p>• 테스트 계정: admin/admin123!, teacher/teacher123!, student/student123!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataSeeder;
