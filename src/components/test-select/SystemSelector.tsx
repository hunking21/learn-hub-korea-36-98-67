import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";

type SystemType = "korea" | "us" | "uk" | null;

interface SystemSelectorProps {
  selected: SystemType;
  onSelect: (system: "korea" | "us" | "uk") => void;
}

const systemOptions = [
  { 
    key: "korea", 
    label: "한국 학년제", 
    sublabel: "초1~고3",
    description: "한국 교육과정 기준 진단"
  },
  { 
    key: "us", 
    label: "미국 학년제", 
    sublabel: "GK, G1~G12",
    description: "미국 교육과정 및 국제학교"
  },
  { 
    key: "uk", 
    label: "영국 학년제", 
    sublabel: "Yr1~Yr13",
    description: "영국 교육과정 기준"
  },
] as const;

const SystemSelector = ({ selected, onSelect }: SystemSelectorProps) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">학년제 선택</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {systemOptions.map((system) => (
          <Card
            key={system.key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selected === system.key 
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                : 'border-border hover:border-primary/30'
            }`}
            onClick={() => onSelect(system.key as SystemType)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{system.label}</CardTitle>
              <CardDescription className="text-sm font-medium text-primary">
                {system.sublabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {system.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleTrigger asChild>
          <div className="text-center">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4 mr-2" />
              학년제 선택이 헷갈리시나요?
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                💡 학년제 선택 안내
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-1">→</span>
                  <p>
                    다니는 학교의 <span className="font-bold text-foreground">고등학교 마지막 학년이 12학년이면</span> → <span className="font-bold">미국 학년제 선택</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-1">→</span>
                  <p>
                    다니는 학교의 <span className="font-bold text-foreground">고등학교 마지막 학년이 13학년이면</span> → <span className="font-bold">영국 학년제 선택</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-1">→</span>
                  <p>
                    학교가 중학교까지만 있거나 잘 모르겠다면, <span className="font-bold">그 학교에서 졸업하는 마지막 학년이 12학년인지 13학년인지 확인</span>하고 선택하세요.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center">
                🗓️ 학년이 바뀌는 방학기간 학년선택 안내
              </h3>
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-bold text-foreground">모든 학년제 공통:</span> 학년이 바뀌는 방학 기간에는 <span className="font-bold">무조건 다음 학년을 선택</span>하세요.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SystemSelector;