import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { ItemAnalysis } from "@/hooks/useTestAnalyticsData";

interface ItemAnalysisTableProps {
  data: ItemAnalysis[];
}

export function ItemAnalysisTable({ data }: ItemAnalysisTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">문항</TableHead>
              <TableHead>정답률</TableHead>
              <TableHead>변별도</TableHead>
              <TableHead>상위그룹</TableHead>
              <TableHead>하위그룹</TableHead>
              <TableHead>오답 분포</TableHead>
              <TableHead className="w-20">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.questionNumber}>
                <TableCell className="font-medium">
                  {item.questionNumber}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {(item.correctRate * 100).toFixed(1)}%
                      </span>
                      {item.correctRate > 0.8 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : item.correctRate < 0.3 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                    <Progress 
                      value={item.correctRate * 100} 
                      className="h-2" 
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span 
                      className={`font-medium ${
                        item.discrimination < 0.2 
                          ? 'text-red-600' 
                          : item.discrimination > 0.4 
                            ? 'text-green-600' 
                            : 'text-yellow-600'
                      }`}
                    >
                      {item.discrimination.toFixed(3)}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {item.discrimination < 0.2 
                        ? '낮음' 
                        : item.discrimination > 0.4 
                          ? '우수' 
                          : '보통'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-green-600">
                    {(item.upperGroupCorrect * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-red-600">
                    {(item.lowerGroupCorrect * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {item.optionDistribution.map((option) => (
                      <div key={option.option} className="flex items-center gap-2 text-xs">
                        <span className="w-4">{option.option}:</span>
                        <span className="w-8">{option.count}</span>
                        <span className="text-muted-foreground">
                          ({option.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {item.isLowDiscrimination ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      주의
                    </Badge>
                  ) : (
                    <Badge variant="secondary">정상</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>• 변별도: 상위그룹과 하위그룹 간 정답률 차이 (0.2 미만 시 개선 권장)</p>
        <p>• 정답률: 전체 응답자 중 정답을 선택한 비율</p>
      </div>
    </div>
  );
}