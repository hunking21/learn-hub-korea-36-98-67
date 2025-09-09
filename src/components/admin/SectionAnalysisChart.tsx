import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, CheckCircle } from "lucide-react";
import { SectionAnalysis } from "@/hooks/useTestAnalyticsData";

interface SectionAnalysisChartProps {
  data: SectionAnalysis[];
}

export function SectionAnalysisChart({ data }: SectionAnalysisChartProps) {
  const timeData = data.map(section => ({
    section: section.sectionName,
    average: section.averageTime,
    median: section.medianTime
  }));

  const completionData = data.map(section => ({
    section: section.sectionName,
    rate: section.completionRate * 100,
    attempts: section.totalAttempts
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((section) => (
          <Card key={section.sectionName}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {section.sectionName}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div className="text-sm">
                    <div className="font-medium">평균 {section.averageTime}분</div>
                    <div className="text-muted-foreground">중앙값 {section.medianTime}분</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div className="text-sm">
                    <div className="font-medium">완료율 {(section.completionRate * 100).toFixed(1)}%</div>
                    <div className="text-muted-foreground">{section.totalAttempts}명 응시</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time Analysis Chart */}
      <Card>
        <CardHeader>
          <CardTitle>섹션별 소요시간 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="section" />
              <YAxis label={{ value: '시간(분)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}분`, 
                  name === 'average' ? '평균시간' : '중앙값시간'
                ]}
              />
              <Bar dataKey="average" fill="hsl(var(--primary))" name="평균" />
              <Bar dataKey="median" fill="hsl(var(--secondary))" name="중앙값" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>섹션별 완료율</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="section" />
              <YAxis 
                label={{ value: '완료율(%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, '완료율']}
                labelFormatter={(label) => `섹션: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>분석 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {data.map((section) => (
              <div key={section.sectionName} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <span className="font-medium">{section.sectionName}:</span>
                  {section.completionRate < 0.8 && (
                    <span className="text-orange-600 ml-1">
                      완료율이 낮습니다 ({(section.completionRate * 100).toFixed(1)}%). 
                      시간 부족이나 난이도 조정이 필요할 수 있습니다.
                    </span>
                  )}
                  {section.averageTime > 30 && (
                    <span className="text-blue-600 ml-1">
                      평균 소요시간이 깁니다 ({section.averageTime}분). 
                      문항 수나 복잡도를 검토해보세요.
                    </span>
                  )}
                  {section.completionRate >= 0.8 && section.averageTime <= 30 && (
                    <span className="text-green-600 ml-1">
                      적절한 완료율과 소요시간을 보이고 있습니다.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}