import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, BarChart3 } from "lucide-react";
import { ScoreDistribution } from "@/hooks/useTestAnalyticsData";

interface ScoreDistributionChartProps {
  data: ScoreDistribution[];
}

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  // Calculate statistics
  const totalStudents = data.reduce((sum, item) => sum + item.count, 0);
  const weightedSum = data.reduce((sum, item) => {
    const midPoint = parseFloat(item.scoreRange.split('-')[0]) + 5; // Use range midpoint
    return sum + (midPoint * item.count);
  }, 0);
  const meanScore = weightedSum / totalStudents;

  // Find mode (most frequent score range)
  const modeRange = data.reduce((max, item) => 
    item.count > max.count ? item : max
  );

  // Calculate quartiles approximation
  let cumulativeCount = 0;
  let q1Range = '', medianRange = '', q3Range = '';
  
  for (const item of data) {
    cumulativeCount += item.count;
    const cumulativePercent = (cumulativeCount / totalStudents) * 100;
    
    if (!q1Range && cumulativePercent >= 25) q1Range = item.scoreRange;
    if (!medianRange && cumulativePercent >= 50) medianRange = item.scoreRange;
    if (!q3Range && cumulativePercent >= 75) q3Range = item.scoreRange;
  }

  // Color function for bars
  const getColor = (scoreRange: string) => {
    const startScore = parseInt(scoreRange.split('-')[0]);
    if (startScore >= 80) return 'hsl(var(--chart-1))'; // Green
    if (startScore >= 60) return 'hsl(var(--chart-2))'; // Blue
    if (startScore >= 40) return 'hsl(var(--chart-3))'; // Yellow
    return 'hsl(var(--chart-4))'; // Red
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 응시자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meanScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">점</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최다 분포</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modeRange.scoreRange}</div>
            <p className="text-xs text-muted-foreground">{modeRange.count}명 ({modeRange.percentage.toFixed(1)}%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">상위 30%</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.filter(item => parseInt(item.scoreRange.split('-')[0]) >= 70)
                    .reduce((sum, item) => sum + item.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">명</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>점수 분포 히스토그램</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="scoreRange" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis label={{ value: '학생 수(명)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}명`, 
                  '학생 수'
                ]}
                labelFormatter={(label) => `점수 구간: ${label}`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.scoreRange)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">분위수 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1사분위 (Q1):</span>
                  <span className="font-medium">{q1Range}</span>
                </div>
                <div className="flex justify-between">
                  <span>중앙값 (Q2):</span>
                  <span className="font-medium">{medianRange}</span>
                </div>
                <div className="flex justify-between">
                  <span>3사분위 (Q3):</span>
                  <span className="font-medium">{q3Range}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">성취도 분석</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>우수 (80점 이상):</span>
                  <span className="font-medium text-green-600">
                    {data.filter(item => parseInt(item.scoreRange.split('-')[0]) >= 80)
                          .reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>보통 (60-79점):</span>
                  <span className="font-medium text-blue-600">
                    {data.filter(item => {
                      const start = parseInt(item.scoreRange.split('-')[0]);
                      return start >= 60 && start < 80;
                    }).reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>미흡 (60점 미만):</span>
                  <span className="font-medium text-red-600">
                    {data.filter(item => parseInt(item.scoreRange.split('-')[0]) < 60)
                          .reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>분포 분석 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <span className="font-medium">정규분포 분석:</span>
                {meanScore >= 70 ? (
                  <span className="text-green-600 ml-1">
                    평균 점수가 높아 전반적으로 좋은 성취도를 보입니다.
                  </span>
                ) : meanScore >= 60 ? (
                  <span className="text-blue-600 ml-1">
                    평균적인 성취도를 보이고 있습니다.
                  </span>
                ) : (
                  <span className="text-red-600 ml-1">
                    평균 점수가 낮습니다. 교육과정이나 시험 난이도 검토가 필요할 수 있습니다.
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <span className="font-medium">분포 편중:</span>
                {modeRange.percentage > 30 ? (
                  <span className="text-orange-600 ml-1">
                    특정 점수 구간({modeRange.scoreRange})에 학생들이 집중되어 있습니다. 
                    변별력 개선을 고려해보세요.
                  </span>
                ) : (
                  <span className="text-green-600 ml-1">
                    적절한 분포를 보이고 있습니다.
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}