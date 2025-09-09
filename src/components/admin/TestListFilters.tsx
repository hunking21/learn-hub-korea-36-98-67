import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestListFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  systemFilter: string;
  onSystemFilterChange: (system: string) => void;
  gradeFilter: string;
  onGradeFilterChange: (grade: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onClearFilters: () => void;
}

export function TestListFilters({
  searchQuery,
  onSearchChange,
  systemFilter,
  onSystemFilterChange,
  gradeFilter,
  onGradeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters
}: TestListFiltersProps) {
  const hasActiveFilters = systemFilter !== 'all' || gradeFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="시험명으로 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* 필터 */}
      <div className="flex flex-wrap gap-3">
        <Select value={systemFilter} onValueChange={onSystemFilterChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="시스템" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 시스템</SelectItem>
            <SelectItem value="KR">한국 (KR)</SelectItem>
            <SelectItem value="US">미국 (US)</SelectItem>
            <SelectItem value="UK">영국 (UK)</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={gradeFilter} onValueChange={onGradeFilterChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="학년" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 학년</SelectItem>
            <SelectItem value="초1">초1</SelectItem>
            <SelectItem value="초2">초2</SelectItem>
            <SelectItem value="초3">초3</SelectItem>
            <SelectItem value="초4">초4</SelectItem>
            <SelectItem value="초5">초5</SelectItem>
            <SelectItem value="초6">초6</SelectItem>
            <SelectItem value="중1">중1</SelectItem>
            <SelectItem value="중2">중2</SelectItem>
            <SelectItem value="중3">중3</SelectItem>
            <SelectItem value="고1">고1</SelectItem>
            <SelectItem value="고2">고2</SelectItem>
            <SelectItem value="고3">고3</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="Draft">초안</SelectItem>
            <SelectItem value="Published">발행됨</SelectItem>
          </SelectContent>
        </Select>
        
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="px-3"
          >
            <X className="h-4 w-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>
      
      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              검색: {searchQuery}
            </Badge>
          )}
          {systemFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              시스템: {systemFilter}
            </Badge>
          )}
          {gradeFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              학년: {gradeFilter}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              상태: {statusFilter === 'Draft' ? '초안' : '발행됨'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}