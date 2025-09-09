
import { seedCategory3Data } from "./seedCategory3Data";
import { seedCategory4Data } from "./seedCategory4Data";
import { seedTestData } from "./seedTestData";

export const seedAllCategoriesData = async () => {
  try {
    console.log("모든 카테고리 테스트 데이터 삽입 시작...");
    
    const results = await Promise.all([
      seedTestData(),
      seedCategory3Data(),
      seedCategory4Data()
    ]);

    console.log("모든 카테고리 테스트 데이터 삽입 완료!");
    return results;
    
  } catch (error) {
    console.error("카테고리 데이터 시드 실패:", error);
    throw error;
  }
};
