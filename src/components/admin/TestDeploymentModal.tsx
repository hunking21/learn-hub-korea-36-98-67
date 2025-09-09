import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import type { Test, TestAssignment } from "@/types";

interface TestDeploymentModalProps {
  test: Test | null;
  assignment?: TestAssignment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: Omit<TestAssignment, 'id' | 'createdAt'>) => void;
  mode: 'create' | 'edit';
}

const GRADE_OPTIONS = [
  '초1', '초2', '초3', '초4', '초5', '초6',
  '중1', '중2', '중3',
  '고1', '고2', '고3',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

export function TestDeploymentModal({ 
  test, 
  assignment, 
  isOpen, 
  onClose, 
  onSave, 
  mode 
}: TestDeploymentModalProps) {
  const [system, setSystem] = useState<'KR' | 'US' | 'UK'>('KR');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && assignment) {
        setSystem(assignment.system);
        setSelectedGrades(assignment.grades);
        setStartDate(new Date(assignment.startAt));
        setEndDate(new Date(assignment.endAt));
      } else {
        setSystem('KR');
        setSelectedGrades([]);
        setStartDate(undefined);
        setEndDate(undefined);
      }
      setErrors([]);
    }
  }, [isOpen, assignment, mode]);

  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (selectedGrades.length === 0) {
      newErrors.push('최소 하나의 학년을 선택해야 합니다.');
    }

    if (!startDate) {
      newErrors.push('응시 시작일을 선택해야 합니다.');
    }

    if (!endDate) {
      newErrors.push('응시 마감일을 선택해야 합니다.');
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.push('마감일은 시작일보다 늦어야 합니다.');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      system,
      grades: selectedGrades,
      startAt: startDate!.toISOString(),
      endAt: endDate!.toISOString(),
    });
    
    onClose();
  };

  const handleRemoveGrade = (grade: string) => {
    setSelectedGrades(prev => prev.filter(g => g !== grade));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '시험 배포' : '배포 수정'}
          </DialogTitle>
          <DialogDescription>
            "{test?.name}"의 배포 설정을 {mode === 'create' ? '설정' : '수정'}하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="text-sm font-medium text-destructive mb-2">오류가 있습니다:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="system">학제</Label>
            <Select value={system} onValueChange={(value: 'KR' | 'US' | 'UK') => setSystem(value)}>
              <SelectTrigger>
                <SelectValue placeholder="학제를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KR">한국 (KR)</SelectItem>
                <SelectItem value="US">미국 (US)</SelectItem>
                <SelectItem value="UK">영국 (UK)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>학년 선택</Label>
            <div className="border rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {GRADE_OPTIONS.map((grade) => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${grade}`}
                      checked={selectedGrades.includes(grade)}
                      onCheckedChange={() => handleGradeToggle(grade)}
                    />
                    <Label
                      htmlFor={`grade-${grade}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {grade}
                    </Label>
                  </div>
                ))}
              </div>
              
              {selectedGrades.length > 0 && (
                <div className="border-t pt-2">
                  <div className="text-xs text-muted-foreground mb-2">선택된 학년:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedGrades.map(grade => (
                      <Badge key={grade} variant="secondary" className="text-xs">
                        {grade}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                          onClick={() => handleRemoveGrade(grade)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>응시 시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon />
                    {startDate ? format(startDate, "yyyy-MM-dd") : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>응시 마감일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon />
                    {endDate ? format(endDate, "yyyy-MM-dd") : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => startDate ? date <= startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="w-4 h-4 mr-2" />
            {mode === 'create' ? '배포하기' : '수정하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}