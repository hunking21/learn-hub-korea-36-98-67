import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";

interface TestTypeSelectorProps {
  selected: string | null;
  onSelect: (testType: string) => void;
  system: string | null;
  grade: string | null;
}

const testOptions = [
  {
    key: "진단고사",
    label: "진단테스트",
    description: "과목별 상세 진단( Reading,Writing,Interview, Math)",
    duration: "15-30분/과목",
    icon: <BookOpen className="h-4 w-4" />,
    recommended: true
  },
  {
    key: "SSAT", 
    label: "SSAT 모의고사",
    description: "실제 시험과 동일한 종합 테스트",
    duration: "180분",
    icon: <Clock className="h-4 w-4" />,
    recommended: false
  }
];

const TestTypeSelector = ({ selected, onSelect, system, grade }: TestTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          테스트 선택하기
        </h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {system === "korea" ? "한국 학년제" : system === "us" ? "미국 학년제" : "영국 학년제"}
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {grade}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          목적에 맞는 테스트를 선택해주세요
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testOptions.map((test) => (
          <Card
            key={test.key}
            className={`cursor-pointer transition-all hover:shadow-lg relative ${
              selected === test.key 
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                : 'border-border hover:border-primary/30'
            }`}
            onClick={() => onSelect(test.key)}
          >
            {test.recommended && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-primary">추천</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {test.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{test.label}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {test.duration}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="leading-relaxed">
                {test.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TestTypeSelector;