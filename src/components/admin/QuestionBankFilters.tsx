import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, Search, Filter } from "lucide-react";
import type { QuestionBankFilters } from "@/hooks/useQuestionBank";

interface QuestionBankFiltersProps {
  filters: QuestionBankFilters;
  onFiltersChange: (filters: QuestionBankFilters) => void;
  allTags: string[];
  allCategories: string[];
}

export function QuestionBankFilters({
  filters,
  onFiltersChange,
  allTags,
  allCategories,
}: QuestionBankFiltersProps) {
  const updateFilter = (key: keyof QuestionBankFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag));
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      type: '',
      difficulty: '',
      tags: [],
      category: '',
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.type || 
    filters.difficulty || 
    filters.tags.length > 0 || 
    filters.category;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">필터</span>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              초기화
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 검색 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">검색</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="문항 내용 검색..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 문항 유형 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">문항 유형</label>
            <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="모든 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">모든 유형</SelectItem>
                <SelectItem value="MCQ">객관식</SelectItem>
                <SelectItem value="Short">주관식</SelectItem>
                <SelectItem value="Speaking">말하기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 난이도 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">난이도</label>
            <Select value={filters.difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
              <SelectTrigger>
                <SelectValue placeholder="모든 난이도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">모든 난이도</SelectItem>
                <SelectItem value="Easy">쉬움</SelectItem>
                <SelectItem value="Medium">보통</SelectItem>
                <SelectItem value="Hard">어려움</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리</label>
            <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="모든 카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">모든 카테고리</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 태그 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">태그 추가</label>
            <Select onValueChange={addTag}>
              <SelectTrigger>
                <SelectValue placeholder="태그 선택" />
              </SelectTrigger>
              <SelectContent>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag} disabled={filters.tags.includes(tag)}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 선택된 태그들 */}
        {filters.tags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">선택된 태그</label>
            <div className="flex flex-wrap gap-2">
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <X
                    className="w-3 h-3 ml-1 hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}