import { Button } from "@/components/ui/button";

type SystemType = "korea" | "us" | "uk" | null;

interface GradeSelectorProps {
  system: SystemType;
  selected: string | null;
  onSelect: (grade: string) => void;
}

// Grade conversion utilities
const convertLegacyGrade = (grade: string, system: SystemType): string => {
  // Convert legacy formats to new system
  if (system === "us") {
    if (grade === "K" || grade === "Kindergarten") return "GK";
    if (grade.match(/^(\d+)(st|nd|rd|th)$/)) {
      const num = grade.match(/^(\d+)/)?.[1];
      return num ? `G${num}` : grade;
    }
    if (grade.match(/^Grade\s+(\d+)$/)) {
      const num = grade.match(/^Grade\s+(\d+)$/)?.[1];
      return num ? `G${num}` : grade;
    }
  } else if (system === "uk") {
    if (grade.match(/^Year\s+(\d+)$/)) {
      const num = grade.match(/^Year\s+(\d+)$/)?.[1];
      return num ? `Yr${num}` : grade;
    }
  }
  return grade;
};

const GradeSelector = ({ system, selected, onSelect }: GradeSelectorProps) => {
  const koreaGrades = ["초1","초2","초3","초4","초5","초6","중1","중2","중3","고1","고2","고3"];
  const usGrades = ["GK", ...Array.from({ length: 12 }, (_, i) => `G${i + 1}`)]; // GK, G1~G12
  const ukGrades = Array.from({ length: 13 }, (_, i) => `Yr${i + 1}`); // Yr1~Yr13

  const gradeOptions = system ? (
    system === "korea" ? koreaGrades :
    system === "us" ? usGrades :
    system === "uk" ? ukGrades : []
  ) : [];

  // Convert legacy selected value if needed
  const normalizedSelected = selected && system ? convertLegacyGrade(selected, system) : null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">현재 학년</h2>
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {system ? (
          gradeOptions.map((grade) => (
            <Button
              key={grade}
              variant={normalizedSelected === grade ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(grade)}
              className="h-12"
            >
              {grade}
            </Button>
          ))
        ) : (
          <div className="col-span-4 md:col-span-6 text-center text-muted-foreground">
            먼저 교육 시스템을 선택해주세요
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeSelector;