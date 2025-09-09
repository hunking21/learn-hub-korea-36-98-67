import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings, Trash2, Edit, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

interface TestSection {
  id: string;
  version_id: string;
  name: string;
  description: string | null;
  order_index: number;
  time_limit_minutes: number | null;
  score_weight: number;
  created_at: string;
  question_count?: number;
}

interface TestVersion {
  id: string;
  grade_level: string;
  system_type: string;
}

interface TestSectionsTabProps {
  selectedVersion: TestVersion | null;
  onUpdate: () => void;
  onSectionSelect: (section: TestSection) => void;
}

export function TestSectionsTab({ selectedVersion, onUpdate, onSectionSelect }: TestSectionsTabProps) {
  const [sections, setSections] = useState<TestSection[]>([]);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [editingSection, setEditingSection] = useState<TestSection | null>(null);
  const [selectedSection, setSelectedSection] = useState<TestSection | null>(null);
  const [sectionForm, setSectionForm] = useState({
    name: "",
    description: "",
    time_limit_minutes: null as number | null,
    score_weight: 100
  });
  const { toast } = useToast();
  const { sessionToken } = useAuth();

  // Direct API call bypassing JWT issues
  const apiCall = async (method: string, endpoint: string, body?: any) => {
    const url = `https://klotxqfcjlzdevohzqlm.supabase.co/rest/v1/${endpoint}`;
    const headers: Record<string, string> = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsb3R4cWZjamx6ZGV2b2h6cWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjYwODksImV4cCI6MjA3MTAwMjA4OX0.XozLy3dxLDH8bEfXCQNSYP0XdPqvck1_XHIYrINGZaA',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    
    if (sessionToken) {
      headers['x-session-token'] = sessionToken;
    }
    
    const config: RequestInit = {
      method,
      headers,
    };
    
    if (body) {
      config.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }
    
    return response.json();
  };

  const loadSections = async () => {
    if (!selectedVersion) return;
    
    try {
      console.log('Loading sections for version:', selectedVersion.id);
      
      const data = await apiCall('GET', `test_sections?select=*,test_section_questions(count)&version_id=eq.${selectedVersion.id}&order=order_index.asc`);
      
      // Add question count to each section
      const sectionsWithCounts = (data || []).map(section => ({
        ...section,
        question_count: section.test_section_questions?.[0]?.count || 0
      }));
      
      console.log('Loaded sections:', sectionsWithCounts.length);
      setSections(sectionsWithCounts);
    } catch (error) {
      console.error('Error loading sections:', error);
      toast({
        title: "오류",
        description: "섹션 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const createSection = async () => {
    if (!selectedVersion) return;

    try {
      console.log('Creating section with token:', sessionToken);

      // Get next order index
      const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order_index)) : -1;

      const sectionData = {
        version_id: selectedVersion.id,
        ...sectionForm,
        order_index: maxOrder + 1
      };

      console.log('Inserting section:', sectionData);

      const data = await apiCall('POST', 'test_sections?select=*', sectionData);
      
      console.log('Section created successfully:', data);

      toast({
        title: "성공",
        description: "섹션이 생성되었습니다."
      });

      setShowCreateSection(false);
      setSectionForm({ name: "", description: "", time_limit_minutes: null, score_weight: 100 });
      loadSections();
      onUpdate();
    } catch (error) {
      console.error('Error creating section:', error);
      toast({
        title: "오류",
        description: "섹션 생성에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const updateSection = async () => {
    if (!editingSection) return;

    try {
      await apiCall('PATCH', `test_sections?id=eq.${editingSection.id}`, sectionForm);

      toast({
        title: "성공",
        description: "섹션이 수정되었습니다."
      });

      setEditingSection(null);
      setSectionForm({ name: "", description: "", time_limit_minutes: null, score_weight: 100 });
      loadSections();
      onUpdate();
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "오류",
        description: "섹션 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('이 섹션을 삭제하시겠습니까? 섹션에 포함된 모든 문제도 함께 삭제됩니다.')) return;

    try {
      await apiCall('DELETE', `test_sections?id=eq.${sectionId}`);

      toast({
        title: "성공",
        description: "섹션이 삭제되었습니다."
      });

      loadSections();
      onUpdate();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "오류",
        description: "섹션 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    try {
      const section1 = sections[currentIndex];
      const section2 = sections[newIndex];

      // Swap order indices
      await Promise.all([
        apiCall('PATCH', `test_sections?id=eq.${section1.id}`, { order_index: section2.order_index }),
        apiCall('PATCH', `test_sections?id=eq.${section2.id}`, { order_index: section1.order_index })
      ]);
      loadSections();
    } catch (error) {
      console.error('Error moving section:', error);
      toast({
        title: "오류",
        description: "섹션 순서 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleEditSection = (section: TestSection) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      description: section.description || "",
      time_limit_minutes: section.time_limit_minutes,
      score_weight: section.score_weight
    });
  };

  useEffect(() => {
    loadSections();
  }, [selectedVersion]);

  if (!selectedVersion) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">학년별 버전을 선택해주세요</p>
        <p className="text-sm">왼쪽에서 관리할 학년별 버전을 선택하면 섹션을 관리할 수 있습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedVersion.system_type}제 {selectedVersion.grade_level} - 섹션 관리
          </h3>
          <p className="text-sm text-muted-foreground">
            시험을 섹션별로 나누어 구성하고 각 섹션의 문제를 관리합니다
          </p>
        </div>
        
        <Dialog open={showCreateSection} onOpenChange={setShowCreateSection}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              섹션 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 섹션 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section_name">섹션 이름</Label>
                <Input
                  id="section_name"
                  placeholder="예: 어휘, 독해, 문법"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="section_description">설명</Label>
                <Textarea
                  id="section_description"
                  placeholder="섹션에 대한 설명을 입력하세요"
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="section_time_limit">시간 제한 (분)</Label>
                <Input
                  id="section_time_limit"
                  type="number"
                  placeholder="제한 없음은 비워두세요"
                  value={sectionForm.time_limit_minutes || ""}
                  onChange={(e) => setSectionForm(prev => ({ 
                    ...prev, 
                    time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="section_score_weight">배점 비중 (%)</Label>
                <Input
                  id="section_score_weight"
                  type="number"
                  min="0"
                  max="100"
                  value={sectionForm.score_weight}
                  onChange={(e) => setSectionForm(prev => ({ 
                    ...prev, 
                    score_weight: parseInt(e.target.value) || 100 
                  }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateSection(false)}>
                  취소
                </Button>
                <Button onClick={createSection} disabled={!sectionForm.name.trim()}>
                  추가
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sections List */}
      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={section.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        섹션 {index + 1}
                      </Badge>
                      {section.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {section.description || "설명이 없습니다"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.time_limit_minutes && (
                      <Badge variant="outline">{section.time_limit_minutes}분</Badge>
                    )}
                    <Badge variant="secondary">{section.score_weight}%</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>문제 수: {section.question_count}개</span>
                    <span>순서: {section.order_index + 1}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* 순서 변경 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveSection(section.id, 'up')}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === sections.length - 1}
                      onClick={() => moveSection(section.id, 'down')}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    
                    {/* 관리 버튼 */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => onSectionSelect(section)}
                    >
                      <Settings className="h-3 w-3" />
                      {section.name.includes('듣기') || section.name.includes('Listening') ? '오디오 관리' : '문제 관리'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleEditSection(section)}
                    >
                      <Edit className="h-3 w-3" />
                      수정
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 섹션이 없습니다</h3>
            <p className="text-muted-foreground mb-4 text-center">
              첫 번째 섹션을 만들어 시험을 구성해보세요
            </p>
            <Button onClick={() => setShowCreateSection(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              섹션 추가
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 섹션 수정 다이얼로그 */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>섹션 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_section_name">섹션 이름</Label>
              <Input
                id="edit_section_name"
                value={sectionForm.name}
                onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_section_description">설명</Label>
              <Textarea
                id="edit_section_description"
                value={sectionForm.description}
                onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_section_time_limit">시간 제한 (분)</Label>
              <Input
                id="edit_section_time_limit"
                type="number"
                value={sectionForm.time_limit_minutes || ""}
                onChange={(e) => setSectionForm(prev => ({ 
                  ...prev, 
                  time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                }))}
              />
            </div>
            <div>
              <Label htmlFor="edit_section_score_weight">배점 비중 (%)</Label>
              <Input
                id="edit_section_score_weight"
                type="number"
                min="0"
                max="100"
                value={sectionForm.score_weight}
                onChange={(e) => setSectionForm(prev => ({ 
                  ...prev, 
                  score_weight: parseInt(e.target.value) || 100 
                }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSection(null)}>
                취소
              </Button>
              <Button onClick={updateSection}>
                수정
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}