import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, Filter, Trash2 } from 'lucide-react';
import { Student, studentManager } from '@/utils/studentUtils';

interface StudentListProps {
  students: Student[];
  onStudentsUpdate: () => void;
  selectedStudents: string[];
  onSelectionChange: (studentIds: string[]) => void;
}

export function StudentList({ 
  students, 
  onStudentsUpdate, 
  selectedStudents, 
  onSelectionChange 
}: StudentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEducationSystem, setFilterEducationSystem] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');

  const educationSystems = useMemo(() => 
    studentManager.getUniqueEducationSystems(), 
    [students]
  );

  const grades = useMemo(() => 
    studentManager.getUniqueGrades(filterEducationSystem), 
    [students, filterEducationSystem]
  );

  const classes = useMemo(() => 
    studentManager.getUniqueClasses(filterEducationSystem, filterGrade), 
    [students, filterEducationSystem, filterGrade]
  );

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = studentManager.searchStudents(searchQuery);
    }

    if (filterEducationSystem) {
      filtered = filtered.filter(s => s.educationSystem === filterEducationSystem);
    }

    if (filterGrade) {
      filtered = filtered.filter(s => s.grade === filterGrade);
    }

    if (filterClass) {
      filtered = filtered.filter(s => s.class === filterClass);
    }

    return filtered;
  }, [students, searchQuery, filterEducationSystem, filterGrade, filterClass]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredStudents.map(s => s.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId]);
    } else {
      onSelectionChange(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm('정말로 이 학생을 삭제하시겠습니까?')) {
      studentManager.deleteStudent(studentId);
      onStudentsUpdate();
      onSelectionChange(selectedStudents.filter(id => id !== studentId));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterEducationSystem('');
    setFilterGrade('');
    setFilterClass('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          학생 목록
          <Badge variant="secondary">{students.length}명</Badge>
        </CardTitle>
        <CardDescription>
          학생을 검색하고 필터링하여 시험에 배포할 학생들을 선택하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="학생 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterEducationSystem} onValueChange={setFilterEducationSystem}>
            <SelectTrigger>
              <SelectValue placeholder="학제 선택" />
            </SelectTrigger>
            <SelectContent>
              {educationSystems.map(system => (
                <SelectItem key={system} value={system}>{system}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger>
              <SelectValue placeholder="학년 선택" />
            </SelectTrigger>
            <SelectContent>
              {grades.map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger>
              <SelectValue placeholder="반 선택" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            필터 초기화
          </Button>
        </div>

        {/* Selection Info */}
        {selectedStudents.length > 0 && (
          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm">
              <strong>{selectedStudents.length}명</strong>의 학생이 선택되었습니다.
            </p>
          </div>
        )}

        {/* Students Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredStudents.length > 0 && 
                      filteredStudents.every(s => selectedStudents.includes(s.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>이름</TableHead>
                <TableHead>학제</TableHead>
                <TableHead>학년</TableHead>
                <TableHead>반</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead className="w-20">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    조건에 맞는 학생이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => 
                          handleSelectStudent(student.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.educationSystem}</Badge>
                    </TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.class || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.contact || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}