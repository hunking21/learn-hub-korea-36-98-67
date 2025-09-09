import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Plus, Copy, RefreshCw, Ban, QrCode, FileText, ExternalLink, Trash2, Eye, Calendar, Users } from "lucide-react";
import { memoryRepo } from "@/repositories/memoryRepo";
import { tokenManager, type AssignmentToken } from "@/utils/tokenUtils";
import { useToast } from "@/hooks/use-toast";
import type { Test, TestAssignment } from "@/types";
import QRCode from "qrcode";

interface AssignmentWithTokens extends TestAssignment {
  test: Test;
  tokens: AssignmentToken[];
}

export default function AdminLinks() {
  const [assignments, setAssignments] = useState<AssignmentWithTokens[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithTokens | null>(null);
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const tests = await memoryRepo.listTests();
      const publishedAssignments: AssignmentWithTokens[] = [];

      tests.forEach(test => {
        if (test.assignments && test.assignments.length > 0) {
          test.assignments
            .forEach(assignment => {
              const tokens = tokenManager.getTokensForAssignment(assignment.id);
              publishedAssignments.push({
                ...assignment,
                test,
                tokens
              });
            });
        }
      });

      setAssignments(publishedAssignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast({
        title: "오류",
        description: "배포된 시험 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!selectedAssignment) return;

    try {
      const firstVersion = selectedAssignment.test.versions?.[0];
      if (!firstVersion) {
        toast({
          title: "오류",
          description: "시험 버전을 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      const token = tokenManager.createToken(
        selectedAssignment.id,
        selectedAssignment.test.id,
        firstVersion.id,
        expiryDays
      );

      await loadAssignments();
      setIsCreateTokenOpen(false);
      setExpiryDays(undefined);
      
      toast({
        title: "토큰 생성 완료",
        description: `접속 토큰 "${token.value}"이 생성되었습니다.`,
      });
    } catch (error) {
      console.error('Failed to create token:', error);
      toast({
        title: "오류",
        description: "토큰 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = (token: AssignmentToken) => {
    const url = tokenManager.generateShortUrl(token.value);
    navigator.clipboard.writeText(url);
    toast({
      title: "복사 완료",
      description: "접속 URL이 클립보드에 복사되었습니다.",
    });
  };

  const handleCopyToken = (tokenValue: string) => {
    navigator.clipboard.writeText(tokenValue);
    toast({
      title: "복사 완료",
      description: "토큰이 클립보드에 복사되었습니다.",
    });
  };

  const handleGenerateQR = async (token: AssignmentToken) => {
    try {
      const url = tokenManager.generateQRCodeData(token.value);
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
      setIsQrDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "오류",
        description: "QR 코드 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeToken = (tokenValue: string) => {
    tokenManager.revokeToken(tokenValue);
    loadAssignments();
    toast({
      title: "토큰 비활성화",
      description: "토큰이 비활성화되었습니다.",
    });
  };

  const handleReissueToken = (tokenValue: string) => {
    const newToken = tokenManager.reissueToken(tokenValue);
    if (newToken) {
      loadAssignments();
      toast({
        title: "토큰 재발급 완료",
        description: `새 토큰 "${newToken.value}"이 발급되었습니다.`,
      });
    } else {
      toast({
        title: "오류",
        description: "토큰 재발급에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteToken = (tokenValue: string) => {
    tokenManager.deleteToken(tokenValue);
    loadAssignments();
    toast({
      title: "토큰 삭제",
      description: "토큰이 삭제되었습니다.",
    });
  };

  const handleBulkPrintPDF = async () => {
    // Create a simple PDF with student instructions
    const printContent = assignments.map(assignment => {
      const activeTokens = assignment.tokens.filter(t => t.isActive);
      return `
        <div style="page-break-after: always; padding: 20px; font-family: Arial, sans-serif;">
          <h2>TN Academy 시험 안내</h2>
          <h3>시험명: ${assignment.test.name}</h3>
          <p><strong>시험 설명:</strong> ${assignment.test.description || '설명 없음'}</p>
          <p><strong>시스템:</strong> ${assignment.system} (${assignment.grades.join(', ')})</p>
          <p><strong>접속 방법:</strong></p>
          <ol>
            <li>웹 브라우저에서 다음 URL에 접속하세요:</li>
            <ul>
              ${activeTokens.map(token => `<li>${tokenManager.generateShortUrl(token.value)}</li>`).join('')}
            </ul>
            <li>또는 다음 토큰을 직접 입력하세요:</li>
            <ul>
              ${activeTokens.map(token => `<li><strong>${token.value}</strong></li>`).join('')}
            </ul>
          </ol>
          <hr style="margin: 20px 0;">
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>TN Academy 시험 접속 안내</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              h2, h3 { color: #333; }
              li { margin: 5px 0; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "인쇄 준비 완료",
      description: "학생 안내문이 준비되었습니다.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusBadge = (token: AssignmentToken) => {
    if (!token.isActive) {
      return <Badge variant="destructive">비활성</Badge>;
    }
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return <Badge variant="destructive">만료</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">접속 링크 관리</h1>
            <p className="text-muted-foreground mt-2">배포된 시험의 접속 토큰을 관리하고 학생들을 위한 링크를 생성하세요.</p>
          </div>
          <Button onClick={handleBulkPrintPDF} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            일괄 인쇄
          </Button>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">배포된 시험이 없습니다</h3>
              <p className="text-muted-foreground">시험을 배포한 후 접속 링크를 생성할 수 있습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {assignments.map(assignment => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{assignment.test.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>시스템: {assignment.system}</span>
                        <span>•</span>
                        <span>토큰 수: {assignment.tokens.length}</span>
                        <span>•</span>
                        <span>활성 토큰: {assignment.tokens.filter(t => t.isActive).length}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setIsCreateTokenOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      토큰 생성
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignment.tokens.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      생성된 토큰이 없습니다.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>토큰</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>생성일시</TableHead>
                            <TableHead>만료일시</TableHead>
                            <TableHead>사용횟수</TableHead>
                            <TableHead>최근 사용</TableHead>
                            <TableHead className="text-right">작업</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignment.tokens.map(token => (
                            <TableRow key={token.value}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                    {token.value}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyToken(token.value)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(token)}</TableCell>
                              <TableCell>{formatDate(token.issuedAt)}</TableCell>
                              <TableCell>
                                {token.expiresAt ? formatDate(token.expiresAt) : '무제한'}
                              </TableCell>
                              <TableCell>{token.usageCount}</TableCell>
                              <TableCell>
                                {token.lastUsedAt ? formatDate(token.lastUsedAt) : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyUrl(token)}
                                    title="URL 복사"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleGenerateQR(token)}
                                    title="QR 코드"
                                  >
                                    <QrCode className="h-3 w-3" />
                                  </Button>
                                  {token.isActive && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReissueToken(token.value)}
                                        title="재발급"
                                      >
                                        <RefreshCw className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRevokeToken(token.value)}
                                        title="비활성화"
                                      >
                                        <Ban className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="삭제"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>토큰 삭제</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          토큰 "{token.value}"을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>취소</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteToken(token.value)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          삭제
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Token Dialog */}
        <Dialog open={isCreateTokenOpen} onOpenChange={setIsCreateTokenOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>접속 토큰 생성</DialogTitle>
              <DialogDescription>
                {selectedAssignment && `"${selectedAssignment.test.name}" 시험을 위한 새 접속 토큰을 생성합니다.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="expiryDays">만료일 설정 (선택사항)</Label>
                <Input
                  id="expiryDays"
                  type="number"
                  min="1"
                  placeholder="만료일까지의 일수 (비워두면 무제한)"
                  value={expiryDays || ''}
                  onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateTokenOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateToken}>
                토큰 생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR 코드</DialogTitle>
              <DialogDescription>
                학생들이 스마트폰으로 스캔하여 시험에 접속할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="rounded-lg border" />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}