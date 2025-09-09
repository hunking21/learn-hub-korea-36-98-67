import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shuffle, Navigation, Eye, ArrowLeft, Shield } from "lucide-react";
import type { TestVersion } from "@/types";

interface ExamOptionsSectionProps {
  version: TestVersion;
  onOptionsUpdate: (options: TestVersion['examOptions']) => void;
}

export function ExamOptionsSection({ version, onOptionsUpdate }: ExamOptionsSectionProps) {
  const options = version.examOptions || {
    shuffleQuestions: false,
    shuffleChoices: false,
    allowBacktrack: true,
    oneQuestionPerPage: false,
    lockdownMode: false
  };

  const handleOptionChange = (key: keyof NonNullable<TestVersion['examOptions']>, value: boolean) => {
    const updatedOptions = {
      ...options,
      [key]: value
    };
    onOptionsUpdate(updatedOptions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          응시 옵션
        </CardTitle>
        <CardDescription>
          학생들이 시험을 응시할 때 적용될 옵션들을 설정합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 문항 순서 섞기 */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Shuffle className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="shuffle-questions" className="text-sm font-medium">
                문항 순서 섞기
              </Label>
              <p className="text-xs text-muted-foreground">
                각 학생마다 문제가 다른 순서로 제시됩니다
              </p>
            </div>
          </div>
          <Switch
            id="shuffle-questions"
            checked={options.shuffleQuestions}
            onCheckedChange={(checked) => handleOptionChange('shuffleQuestions', checked)}
          />
        </div>

        {/* 선택지 순서 섞기 */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Shuffle className="h-4 w-4 text-muted-foreground rotate-90" />
            <div>
              <Label htmlFor="shuffle-choices" className="text-sm font-medium">
                선택지 순서 섞기
              </Label>
              <p className="text-xs text-muted-foreground">
                객관식 문제의 선택지가 다른 순서로 제시됩니다
              </p>
            </div>
          </div>
          <Switch
            id="shuffle-choices"
            checked={options.shuffleChoices}
            onCheckedChange={(checked) => handleOptionChange('shuffleChoices', checked)}
          />
        </div>

        {/* 뒤로가기 허용 */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="allow-backtrack" className="text-sm font-medium">
                뒤로가기 허용
              </Label>
              <p className="text-xs text-muted-foreground">
                학생이 이전 문제로 돌아가서 답을 수정할 수 있습니다
              </p>
            </div>
          </div>
          <Switch
            id="allow-backtrack"
            checked={options.allowBacktrack}
            onCheckedChange={(checked) => handleOptionChange('allowBacktrack', checked)}
          />
        </div>

        {/* 한 문제씩 표시 */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="one-question-per-page" className="text-sm font-medium">
                한 문제씩 표시
              </Label>
              <p className="text-xs text-muted-foreground">
                한 번에 하나의 문제만 화면에 표시됩니다
              </p>
            </div>
          </div>
          <Switch
            id="one-question-per-page"
            checked={options.oneQuestionPerPage}
            onCheckedChange={(checked) => handleOptionChange('oneQuestionPerPage', checked)}
          />
        </div>

        {/* 시험 잠금 모드 */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="lockdown-mode" className="text-sm font-medium">
                시험 잠금 모드
              </Label>
              <p className="text-xs text-muted-foreground">
                전체화면 모드, 우클릭 차단, 단축키 무효화 등 부정행위 방지 기능
              </p>
            </div>
          </div>
          <Switch
            id="lockdown-mode"
            checked={options.lockdownMode}
            onCheckedChange={(checked) => handleOptionChange('lockdownMode', checked)}
          />
        </div>

        {/* 옵션 조합 안내 */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>💡 권장사항:</strong> 공정한 평가를 위해 문항 순서 섞기와 선택지 순서 섞기를 활성화하는 것이 좋습니다.
            {!options.allowBacktrack && " 뒤로가기를 비허용하면 신중한 답변을 유도할 수 있습니다."}
            {options.lockdownMode && " 잠금 모드는 부정행위를 강력히 방지하지만 학생에게 부담을 줄 수 있습니다."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}