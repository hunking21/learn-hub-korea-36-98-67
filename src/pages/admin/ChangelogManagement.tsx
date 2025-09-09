import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Upload, 
  Trash2,
  Edit,
  Plus,
  History,
  FileDown
} from 'lucide-react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { changelogManager, logEvent } from '@/utils/changelogUtils';
import type { ChangelogEntry } from '@/types/changelog';
import { toast } from 'sonner';

export default function ChangelogManagement() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ChangelogEntry | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    area: 'tests' as ChangelogEntry['area'],
    action: 'create' as ChangelogEntry['action'],
    summary: '',
    details: '',
  });

  useEffect(() => {
    loadEntries();
    const unsubscribe = changelogManager.subscribe(loadEntries);
    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, selectedArea, selectedAction, dateFrom, dateTo]);

  const loadEntries = () => {
    setLoading(true);
    try {
      const allEntries = changelogManager.getEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Failed to load changelog entries:', error);
      toast.error('변경 기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filtered = changelogManager.getFilteredEntries({
      area: selectedArea,
      action: selectedAction,
      dateFrom,
      dateTo,
      search: searchTerm,
    });
    setFilteredEntries(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedArea('all');
    setSelectedAction('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleCreateEntry = () => {
    if (!formData.summary.trim()) {
      toast.error('요약은 필수 입력 항목입니다.');
      return;
    }

    changelogManager.logEvent(
      formData.area,
      formData.action,
      formData.summary,
      formData.details || undefined
    );

    setIsCreateModalOpen(false);
    setFormData({ area: 'tests', action: 'create', summary: '', details: '' });
    toast.success('변경 기록이 추가되었습니다.');
  };

  const handleEditEntry = () => {
    if (!selectedEntry || !formData.summary.trim()) {
      toast.error('요약은 필수 입력 항목입니다.');
      return;
    }

    const success = changelogManager.updateEntry(selectedEntry.id, {
      area: formData.area,
      action: formData.action,
      summary: formData.summary,
      details: formData.details || undefined,
    });

    if (success) {
      setIsEditModalOpen(false);
      setSelectedEntry(null);
      toast.success('변경 기록이 수정되었습니다.');
    } else {
      toast.error('변경 기록 수정에 실패했습니다.');
    }
  };

  const handleDeleteEntry = (entry: ChangelogEntry) => {
    const success = changelogManager.deleteEntry(entry.id);
    if (success) {
      toast.success('변경 기록이 삭제되었습니다.');
    } else {
      toast.error('변경 기록 삭제에 실패했습니다.');
    }
  };

  const openEditModal = (entry: ChangelogEntry) => {
    setSelectedEntry(entry);
    setFormData({
      area: entry.area,
      action: entry.action,
      summary: entry.summary,
      details: entry.details || '',
    });
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ area: 'tests', action: 'create', summary: '', details: '' });
    setIsCreateModalOpen(true);
  };

  const exportToJSON = () => {
    try {
      const jsonData = changelogManager.exportToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `changelog_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('JSON 파일이 다운로드되었습니다.');
    } catch (error) {
      toast.error('JSON 내보내기에 실패했습니다.');
    }
  };

  const exportToMarkdown = () => {
    try {
      const markdown = changelogManager.exportToMarkdown();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `changelog_${new Date().toISOString().split('T')[0]}.md`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Markdown 파일이 다운로드되었습니다.');
    } catch (error) {
      toast.error('Markdown 내보내기에 실패했습니다.');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = changelogManager.importFromJSON(content);
        
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('파일 읽기에 실패했습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllEntries = () => {
    changelogManager.clearAll();
    toast.success('모든 변경 기록이 삭제되었습니다.');
  };

  const getAreaKorean = (area: string): string => {
    const mapping: Record<string, string> = {
      tests: '시험',
      versions: '버전',
      sections: '섹션',
      questions: '문항',
      assignments: '배정',
      settings: '설정',
      students: '학생',
      tokens: '토큰',
      backup: '백업',
    };
    return mapping[area] || area;
  };

  const getActionKorean = (action: string): string => {
    const mapping: Record<string, string> = {
      create: '생성',
      update: '수정',
      delete: '삭제',
      publish: '발행',
      import: '가져오기',
      export: '내보내기',
      deploy: '배포',
      restore: '복원',
    };
    return mapping[action] || action;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      publish: 'default',
      import: 'outline',
      export: 'outline',
      deploy: 'default',
      restore: 'secondary',
    };
    return colors[action] || 'secondary';
  };

  const areas = ['tests', 'versions', 'sections', 'questions', 'assignments', 'settings', 'students', 'tokens', 'backup'];
  const actions = ['create', 'update', 'delete', 'publish', 'import', 'export', 'deploy', 'restore'];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8" />
              변경 기록 관리
            </h1>
            <p className="text-muted-foreground mt-2">
              시스템의 모든 변경 사항을 추적하고 관리합니다.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              기록 추가
            </Button>
            
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
              id="import-changelog"
            />
            <Button variant="outline" onClick={() => document.getElementById('import-changelog')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              가져오기
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">총 기록 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">오늘 기록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => e.at.startsWith(new Date().toISOString().split('T')[0])).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">최근 7일</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => {
                  const entryDate = new Date(e.at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return entryDate >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">필터된 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{filteredEntries.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              필터 및 검색
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="요약이나 세부사항 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <Label>영역</Label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 영역</SelectItem>
                    {areas.map(area => (
                      <SelectItem key={area} value={area}>
                        {getAreaKorean(area)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>액션</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 액션</SelectItem>
                    {actions.map(action => (
                      <SelectItem key={action} value={action}>
                        {getActionKorean(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>시작 날짜</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div>
                <Label>종료 날짜</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetFilters}>
                필터 초기화
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToJSON}>
                  <FileDown className="h-4 w-4 mr-2" />
                  JSON 내보내기
                </Button>
                <Button variant="outline" onClick={exportToMarkdown}>
                  <FileText className="h-4 w-4 mr-2" />
                  Markdown 내보내기
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      전체 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>모든 변경 기록 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        모든 변경 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllEntries}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>변경 기록 ({filteredEntries.length}개)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>영역</TableHead>
                  <TableHead>액션</TableHead>
                  <TableHead>요약</TableHead>
                  <TableHead>세부사항</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(entry.at).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.at).toLocaleTimeString('ko-KR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAreaKorean(entry.area)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(entry.action) as any}>
                          {getActionKorean(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={entry.summary}>
                          {entry.summary}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {entry.details && (
                          <div className="truncate text-muted-foreground" title={entry.details}>
                            {entry.details}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>변경 기록 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 변경 기록을 삭제하시겠습니까?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEntry(entry)}>
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>새 변경 기록 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>영역</Label>
                  <Select 
                    value={formData.area} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, area: value as ChangelogEntry['area'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area} value={area}>
                          {getAreaKorean(area)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>액션</Label>
                  <Select 
                    value={formData.action} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, action: value as ChangelogEntry['action'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map(action => (
                        <SelectItem key={action} value={action}>
                          {getActionKorean(action)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>요약 *</Label>
                <Input
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="변경 사항의 간단한 요약"
                />
              </div>
              
              <div>
                <Label>세부사항 (선택)</Label>
                <Textarea
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="변경 사항의 자세한 설명"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateEntry}>
                  추가
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>변경 기록 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>영역</Label>
                  <Select 
                    value={formData.area} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, area: value as ChangelogEntry['area'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area} value={area}>
                          {getAreaKorean(area)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>액션</Label>
                  <Select 
                    value={formData.action} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, action: value as ChangelogEntry['action'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map(action => (
                        <SelectItem key={action} value={action}>
                          {getActionKorean(action)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>요약 *</Label>
                <Input
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="변경 사항의 간단한 요약"
                />
              </div>
              
              <div>
                <Label>세부사항 (선택)</Label>
                <Textarea
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="변경 사항의 자세한 설명"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleEditEntry}>
                  수정
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}