import React, { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Link2, Calendar, User, AlertCircle, CheckCircle } from 'lucide-react';
import { resultTokenManager, StudentTestAttempt, ResultToken } from '@/utils/resultTokenUtils';
import QRCode from 'qrcode';

interface ResultTokenGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: StudentTestAttempt;
  onTokenUpdate?: () => void;
}

export function ResultTokenGenerator({ 
  isOpen, 
  onClose, 
  attempt, 
  onTokenUpdate 
}: ResultTokenGeneratorProps) {
  const [expiryDays, setExpiryDays] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<ResultToken | null>(null);
  const [qrCode, setQrCode] = useState<string>('');

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const token = resultTokenManager.createResultToken(attempt.id, expiryDays);
      if (token) {
        setGeneratedToken(token);
        
        // Generate QR code
        const url = resultTokenManager.generateResultUrl(token.value);
        const qrCodeData = await QRCode.toDataURL(url);
        setQrCode(qrCodeData);
        
        onTokenUpdate?.();
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeToken = () => {
    if (attempt.resultToken && confirm('정말로 이 토큰을 무효화하시겠습니까?')) {
      resultTokenManager.revokeToken(attempt.resultToken.value);
      setGeneratedToken(null);
      setQrCode('');
      onTokenUpdate?.();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const currentToken = generatedToken || attempt.resultToken;
  const resultUrl = currentToken ? resultTokenManager.generateResultUrl(currentToken.value) : '';

  const handleClose = () => {
    setGeneratedToken(null);
    setQrCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            보호자용 결과 링크 관리
          </DialogTitle>
          <DialogDescription>
            학생의 시험 결과를 보호자가 안전하게 확인할 수 있는 링크를 생성하거나 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student & Test Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{attempt.studentName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{attempt.testName}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">
                {attempt.score}/{attempt.maxScore}점 ({attempt.percentage}%)
              </Badge>
              <Badge className="bg-primary/10 text-primary">
                {attempt.grade}
              </Badge>
            </div>
          </div>

          {/* Current Token Status */}
          {currentToken ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  활성화된 결과 링크가 있습니다. 
                  (만료일: {new Date(currentToken.expiresAt).toLocaleDateString()})
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">토큰</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                      {currentToken.value}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentToken.value)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">결과 링크</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                      {resultUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(resultUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {qrCode && (
                  <div className="text-center">
                    <Label className="text-sm font-medium">QR 코드</Label>
                    <div className="mt-2">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="w-32 h-32 mx-auto border rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                활성화된 결과 링크가 없습니다. 새로운 링크를 생성해주세요.
              </AlertDescription>
            </Alert>
          )}

          {/* Token Generation */}
          {!currentToken && (
            <div>
              <Label htmlFor="expiry-days">링크 유효기간 (일)</Label>
              <Input
                id="expiry-days"
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                권장: 30일 (보안을 위해 적절한 기간을 설정해주세요)
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            닫기
          </Button>
          
          {currentToken ? (
            <Button 
              variant="destructive" 
              onClick={handleRevokeToken}
            >
              링크 무효화
            </Button>
          ) : (
            <Button 
              onClick={handleGenerateToken} 
              disabled={isGenerating}
            >
              {isGenerating ? '생성 중...' : '결과 링크 생성'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}