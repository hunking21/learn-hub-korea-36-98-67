import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ItemAnalysisTable } from "./ItemAnalysisTable";
import { SectionAnalysisChart } from "./SectionAnalysisChart";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import { useTestAnalyticsData } from "@/hooks/useTestAnalyticsData";

export function TestAnalyticsDashboard() {
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const { data, isLoading } = useTestAnalyticsData({
    testId: selectedTest,
    versionId: selectedVersion,
    status: statusFilter === "all" ? undefined : statusFilter,
    dateFrom,
    dateTo
  });

  const exportToCSV = () => {
    if (!data) return;
    
    // Create CSV content
    const csvContent = [
      ["문항", "정답률", "변별도", "상위그룹 정답률", "하위그룹 정답률"],
      ...data.itemAnalysis.map(item => [
        item.questionNumber,
        `${(item.correctRate * 100).toFixed(1)}%`,
        item.discrimination.toFixed(3),
        `${(item.upperGroupCorrect * 100).toFixed(1)}%`,
        `${(item.lowerGroupCorrect * 100).toFixed(1)}%`
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `test_analysis_${selectedTest}_${selectedVersion}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>분석 설정</CardTitle>
          <CardDescription>시험과 조건을 선택하여 분석을 시작하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">시험 선택</label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue placeholder="시험 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test1">중간고사 영어</SelectItem>
                  <SelectItem value="test2">기말고사 수학</SelectItem>
                  <SelectItem value="test3">모의고사 국어</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">버전 선택</label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="버전 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v1">버전 1.0</SelectItem>
                  <SelectItem value="v2">버전 2.0</SelectItem>
                  <SelectItem value="v3">버전 3.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">상태 필터</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="submitted">제출완료</SelectItem>
                  <SelectItem value="reviewed">검토완료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">기간 선택</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "yyyy-MM-dd") : "시작일"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "yyyy-MM-dd") : "종료일"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              {selectedTest && (
                <Badge variant="secondary">시험: {selectedTest}</Badge>
              )}
              {selectedVersion && (
                <Badge variant="secondary">버전: {selectedVersion}</Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary">상태: {statusFilter}</Badge>
              )}
            </div>
            <Button onClick={exportToCSV} disabled={!data} className="gap-2">
              <Download className="h-4 w-4" />
              CSV 내보내기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      {selectedTest && selectedVersion && (
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">문항 분석</TabsTrigger>
            <TabsTrigger value="sections">섹션 분석</TabsTrigger>
            <TabsTrigger value="distribution">수험자 분포</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  문항별 분석
                  {data?.itemAnalysis.some(item => item.discrimination < 0.2) && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      낮은 변별도 발견
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  정답률, 변별도, 오답 선택지 분포를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data && <ItemAnalysisTable data={data.itemAnalysis} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>섹션별 분석</CardTitle>
                <CardDescription>
                  섹션별 소요시간과 완료율을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data && <SectionAnalysisChart data={data.sectionAnalysis} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>점수 분포</CardTitle>
                <CardDescription>
                  총점 히스토그램과 통계를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data && <ScoreDistributionChart data={data.scoreDistribution} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedTest || !selectedVersion ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">시험과 버전을 선택하여 분석을 시작하세요</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}