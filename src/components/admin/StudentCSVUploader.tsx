import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { studentManager, Student } from '@/utils/studentUtils';

interface StudentCSVUploaderProps {
  onUploadSuccess: (students: Student[]) => void;
}

export function StudentCSVUploader({ onUploadSuccess }: StudentCSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: Student[];
    errors: string[];
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const result = studentManager.addStudentsFromCSV(text);
      setUploadResult(result);
      
      if (result.success.length > 0) {
        onUploadSuccess(result.success);
      }
    } catch (error) {
      setUploadResult({
        success: [],
        errors: ['CSV 파일을 처리하는 중 오류가 발생했습니다.']
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploader = () => {
    setFile(null);
    setUploadResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          학생 명단 CSV 업로드
        </CardTitle>
        <CardDescription>
          CSV 파일 형식: 이름, 학제, 학년, 연락처, 반
          <br />
          예시: 홍길동, 중등, 1학년, 010-1234-5678, 1반
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadResult && (
          <>
            <div>
              <Label htmlFor="csv-file">CSV 파일 선택</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-2"
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)}KB</Badge>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? '업로드 중...' : 'CSV 업로드'}
            </Button>
          </>
        )}

        {uploadResult && (
          <div className="space-y-4">
            {uploadResult.success.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>{uploadResult.success.length}명의 학생</strong>이 성공적으로 등록되었습니다.
                </AlertDescription>
              </Alert>
            )}

            {uploadResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <strong>{uploadResult.errors.length}개의 오류</strong>가 발생했습니다:
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={resetUploader} variant="outline" className="w-full">
              새 파일 업로드
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}