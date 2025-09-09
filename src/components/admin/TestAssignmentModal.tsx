import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, QrCode, Link2, Send, AlertTriangle } from 'lucide-react';
import { Student } from '@/utils/studentUtils';
import { tokenManager, AssignmentToken } from '@/utils/tokenUtils';
import QRCode from 'qrcode';

interface TestAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
}

// Mock test data - In real app, this would come from your test management system
const mockTests = [
  {
    id: 'test1',
    name: '중간고사 영어 시험',
    version: 'v1.0',
    educationSystem: '중등',
    grade: '1학년',
    isPublished: true
  },
  {
    id: 'test2', 
    name: '기말고사 수학 시험',
    version: 'v1.1',
    educationSystem: '중등',
    grade: '1학년',
    isPublished: true
  },
  {
    id: 'test3',
    name: '진단평가 국어',
    version: 'v2.0',
    educationSystem: '초등',
    grade: '6학년',
    isPublished: true
  }
];

export function TestAssignmentModal({ isOpen, onClose, selectedStudents }: TestAssignmentModalProps) {
  const [selectedTest, setSelectedTest] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignments, setAssignments] = useState<{
    student: Student;
    token: AssignmentToken;
    qrCode: string;
    warnings: string[];
  }[]>([]);
  const [showResults, setShowResults] = useState(false);

  const compatibleTests = mockTests.filter(test => {
    if (selectedStudents.length === 0) return true;
    
    // Check if students have compatible education system and grade
    const studentSystems = [...new Set(selectedStudents.map(s => s.educationSystem))];
    const studentGrades = [...new Set(selectedStudents.map(s => s.grade))];
    
    return studentSystems.some(sys => test.educationSystem === sys) &&
           studentGrades.some(grade => test.grade === grade);
  });

  const handleAssign = async () => {
    if (!selectedTest) return;
    
    const test = mockTests.find(t => t.id === selectedTest);
    if (!test) return;

    setIsAssigning(true);
    const newAssignments: typeof assignments = [];

    for (const student of selectedStudents) {
      const warnings: string[] = [];
      
      // Check compatibility
      if (student.educationSystem !== test.educationSystem) {
        warnings.push(`학제 불일치: 학생(${student.educationSystem}) vs 시험(${test.educationSystem})`);
      }
      
      if (student.grade !== test.grade) {
        warnings.push(`학년 불일치: 학생(${student.grade}) vs 시험(${test.grade})`);
      }

      // Create token
      const token = tokenManager.createToken(
        `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        test.id,
        test.version,
        expiryDays
      );

      // Generate QR code
      const url = tokenManager.generateShortUrl(token.value);
      const qrCode = await QRCode.toDataURL(url);

      newAssignments.push({
        student,
        token,
        qrCode,
        warnings
      });
    }

    setAssignments(newAssignments);
    setShowResults(true);
    setIsAssigning(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllUrls = () => {
    const urls = assignments.map(a => 
      `${a.student.name}: ${tokenManager.generateShortUrl(a.token.value)}`
    ).join('\n');
    copyToClipboard(urls);
  };

  const handleClose = () => {
    setSelectedTest('');
    setAssignments([]);
    setShowResults(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            시험 배포
          </DialogTitle>
          <DialogDescription>
            선택된 {selectedStudents.length}명의 학생에게 시험을 배포합니다.
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Test Selection */}
            <div>
              <Label htmlFor="test-select">배포할 시험 선택</Label>
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Published 상태의 시험을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleTests.map(test => (
                    <SelectItem key={test.id} value={test.id}>
                      <div className="flex items-center gap-2">
                        <span>{test.name}</span>
                        <Badge variant="outline">{test.educationSystem}</Badge>
                        <Badge variant="outline">{test.grade}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiry Settings */}
            <div>
              <Label htmlFor="expiry-days">토큰 유효기간 (일)</Label>
              <Input
                id="expiry-days"
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="mt-2"
              />
            </div>

            {/* Compatibility Warnings */}
            {selectedTest && (
              <div className="space-y-2">
                <h4 className="font-medium">호환성 확인</h4>
                {selectedStudents.map(student => {
                  const test = mockTests.find(t => t.id === selectedTest)!;
                  const warnings = [];
                  
                  if (student.educationSystem !== test.educationSystem) {
                    warnings.push('학제 불일치');
                  }
                  if (student.grade !== test.grade) {
                    warnings.push('학년 불일치');
                  }

                  return (
                    <div key={student.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <span className="text-sm">{student.name}</span>
                      {warnings.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <Badge variant="secondary" className="text-amber-600">
                            {warnings.join(', ')}
                          </Badge>
                        </div>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">호환</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">배포 완료</h3>
              <Button onClick={copyAllUrls} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                전체 URL 복사
              </Button>
            </div>

            {/* Assignment Results */}
            <div className="grid gap-4">
              {assignments.map(({ student, token, qrCode, warnings }) => (
                <Card key={student.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{student.name}</h4>
                          <Badge variant="outline">{student.educationSystem}</Badge>
                          <Badge variant="outline">{student.grade}</Badge>
                          {student.class && (
                            <Badge variant="outline">{student.class}</Badge>
                          )}
                        </div>

                        {warnings.length > 0 && (
                          <Alert className="mb-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="text-sm">
                                <strong>경고:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {warnings.map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">토큰:</Label>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {token.value}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(token.value)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs">URL:</Label>
                            <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                              {tokenManager.generateShortUrl(token.value)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(tokenManager.generateShortUrl(token.value))}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={qrCode}
                          alt="QR Code"
                          className="w-20 h-20 border rounded"
                        />
                        <span className="text-xs text-muted-foreground">QR 코드</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {!showResults ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button 
                onClick={handleAssign} 
                disabled={!selectedTest || isAssigning}
              >
                {isAssigning ? '배포 중...' : '시험 배포'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              완료
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}