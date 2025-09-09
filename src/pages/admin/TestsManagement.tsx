import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { QuickTestBuilder } from "@/components/admin/QuickTestBuilder";
import { TestDeploymentModal } from "@/components/admin/TestDeploymentModal";
import { TestPreviewModal } from "@/components/admin/TestPreviewModal";
import { TestListFilters } from "@/components/admin/TestListFilters";
import { SimplifiedTestCard } from "@/components/admin/SimplifiedTestCard";
import { useState, useEffect } from "react";
import { memoryRepo } from "@/repositories/memoryRepo";
import type { Test } from "@/types/schema";
import { useToast } from "@/hooks/use-toast";

export default function TestsManagement() {
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [builderTest, setBuilderTest] = useState<Test | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [deploymentTest, setDeploymentTest] = useState<Test | null>(null);
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [previewTest, setPreviewTest] = useState<Test | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tests, searchQuery, systemFilter, gradeFilter, statusFilter]);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      const testList = await memoryRepo.listTests();
      setTests(testList);
    } catch (error) {
      console.error('테스트 목록 로드 실패:', error);
      toast({
        title: "오류",
        description: "시험 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tests];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(test => 
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // System filter
    if (systemFilter !== 'all') {
      filtered = filtered.filter(test => 
        test.versions?.some(version => 
          version.targets?.some(target => target.system === systemFilter)
        )
      );
    }

    // Grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(test => 
        test.versions?.some(version => 
          version.targets?.some(target => target.grades.includes(gradeFilter))
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter);
    }

    setFilteredTests(filtered);
  };

  const handleCreateTest = () => {
    setBuilderTest(null);
    setIsBuilderOpen(true);
  };

  const handleEditTest = (test: Test) => {
    setBuilderTest(test);
    setIsBuilderOpen(true);
  };

  const handlePreviewTest = (test: Test) => {
    setPreviewTest(test);
    setIsPreviewModalOpen(true);
  };

  const handleDeployTest = (test: Test) => {
    setDeploymentTest(test);
    setIsDeploymentModalOpen(true);
  };

  const handleCardClick = (test: Test) => {
    handleEditTest(test);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSystemFilter("all");
    setGradeFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">시험 목록을 불러오는 중...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">시험 관리</h1>
            <p className="text-muted-foreground">시험을 생성하고 관리할 수 있습니다.</p>
          </div>
        </div>

        {/* 새 시험 생성 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              새 시험 생성
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateTest} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              빠른 시험 생성
            </Button>
          </CardContent>
        </Card>

        {/* 검색 및 필터 */}
        <TestListFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          systemFilter={systemFilter}
          onSystemFilterChange={setSystemFilter}
          gradeFilter={gradeFilter}
          onGradeFilterChange={setGradeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={clearFilters}
        />

        {/* 시험 목록 */}
        <div>
          {filteredTests.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <div className="text-muted-foreground text-lg">
                    {tests.length === 0 ? "등록된 시험이 없습니다" : "필터 조건에 맞는 시험이 없습니다"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tests.length === 0 ? "위 폼을 사용하여 첫 번째 시험을 생성해보세요." : "다른 필터 조건을 시도해보세요."}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTests.map((test) => (
                <SimplifiedTestCard
                  key={test.id}
                  test={test}
                  onEdit={handleEditTest}
                  onPreview={handlePreviewTest}
                  onDeploy={handleDeployTest}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuickTestBuilder
        test={builderTest}
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setBuilderTest(null);
        }}
        onTestUpdated={loadTests}
      />

      {deploymentTest && (
        <TestDeploymentModal
          test={deploymentTest}
          isOpen={isDeploymentModalOpen}
          onClose={() => {
            setIsDeploymentModalOpen(false);
            setDeploymentTest(null);
            loadTests();
          }}
          mode="create"
          onSave={loadTests}
        />
      )}

      {previewTest && (
        <TestPreviewModal
          test={previewTest}
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setPreviewTest(null);
          }}
        />
      )}
    </AdminLayout>
  );
}