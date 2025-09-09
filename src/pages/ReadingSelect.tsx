import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useReadingPassages } from "@/hooks/useReadingPassages";
import { ReadingPassageCard } from "@/components/reading/ReadingPassageCard";
import { Loader2 } from "lucide-react";

export default function ReadingSelect() {
  const navigate = useNavigate();
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const { data: passages = [], isLoading } = useReadingPassages({
    grade: selectedGrade || undefined
  });

  const handleStartReading = (passageId: string) => {
    navigate(`/reading-test/${passageId}`);
  };

  const systems = [
    { value: "elementary", label: "초등" },
    { value: "middle", label: "중등" },
    { value: "high", label: "고등" },
  ];

  const grades = [
    { value: "1", label: "1학년" },
    { value: "2", label: "2학년" },
    { value: "3", label: "3학년" },
    { value: "4", label: "4학년" },
    { value: "5", label: "5학년" },
    { value: "6", label: "6학년" },
  ];

  const subjects = [
    { value: "국어", label: "국어" },
    { value: "영어", label: "영어" },
    { value: "문학", label: "문학" },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            리딩 테스트 선택
          </h1>
          <p className="text-muted-foreground">
            지문을 읽고 문제를 풀어보세요
          </p>
        </div>

        {/* 필터 선택 */}
        <Card>
          <CardHeader>
            <CardTitle>조건 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">교육과정</label>
                <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                  <SelectTrigger>
                    <SelectValue placeholder="교육과정을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {systems.map((system) => (
                      <SelectItem key={system.value} value={system.value}>
                        {system.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">학년</label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="학년을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">과목</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="과목을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.value} value={subject.value}>
                        {subject.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 지문 목록 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            지문 목록 ({passages.length}개)
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : passages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  선택한 조건에 맞는 지문이 없습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {passages.map((passage) => (
                <ReadingPassageCard
                  key={passage.id}
                  passage={passage}
                  onStart={handleStartReading}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}