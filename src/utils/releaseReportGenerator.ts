import jsPDF from 'jspdf';
import { ChecklistItem } from '@/hooks/useReleaseChecklist';

export const generateReleaseReport = async (checklist: ChecklistItem[]): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // 한글 폰트 설정 (기본 폰트 사용)
  doc.setFont('helvetica');

  // 제목
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TN Academy - System Release Go/No-Go Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // 생성 일시
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  const dateStr = `Generated: ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  doc.text(dateStr, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // 전체 상태 요약
  const overallStatus = checklist.every(item => item.status === 'pass');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  
  if (overallStatus) {
    doc.setTextColor(0, 128, 0); // 녹색
    doc.text('OVERALL STATUS: GO', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    doc.setTextColor(255, 0, 0); // 빨간색
    doc.text('OVERALL STATUS: NO-GO', pageWidth / 2, yPosition, { align: 'center' });
  }
  
  doc.setTextColor(0, 0, 0); // 검은색으로 복원
  yPosition += 20;

  // 요약 통계
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const passCount = checklist.filter(item => item.status === 'pass').length;
  const failCount = checklist.filter(item => item.status === 'fail').length;
  
  doc.text(`Total Checks: ${checklist.length}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Passed: ${passCount}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Failed: ${failCount}`, 20, yPosition);
  yPosition += 15;

  // 선 그리기
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  // 체크리스트 상세 내용
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Checklist Results', 20, yPosition);
  yPosition += 15;

  // 각 항목별 상세
  checklist.forEach((item, index) => {
    // 페이지 넘김 확인
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // 항목 번호와 제목
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    // 상태에 따른 색상
    if (item.status === 'pass') {
      doc.setTextColor(0, 128, 0); // 녹색
      doc.text(`${index + 1}. ${item.title} - PASS`, 20, yPosition);
    } else if (item.status === 'fail') {
      doc.setTextColor(255, 0, 0); // 빨간색
      doc.text(`${index + 1}. ${item.title} - FAIL`, 20, yPosition);
    } else {
      doc.setTextColor(255, 165, 0); // 주황색
      doc.text(`${index + 1}. ${item.title} - CHECKING`, 20, yPosition);
    }
    
    doc.setTextColor(0, 0, 0); // 검은색으로 복원
    yPosition += 8;

    // 설명
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(item.description, pageWidth - 40);
    doc.text(descLines, 25, yPosition);
    yPosition += descLines.length * 5;

    // 세부 정보 (있는 경우)
    if (item.details && item.details.length > 0) {
      yPosition += 3;
      doc.setFont('helvetica', 'italic');
      doc.text('Details:', 25, yPosition);
      yPosition += 5;
      
      item.details.forEach(detail => {
        const detailLines = doc.splitTextToSize(`- ${detail}`, pageWidth - 50);
        doc.text(detailLines, 30, yPosition);
        yPosition += detailLines.length * 4;
      });
    }

    // 오류 정보 (있는 경우)
    if (item.error) {
      yPosition += 3;
      doc.setTextColor(255, 0, 0);
      doc.setFont('helvetica', 'italic');
      doc.text('Error:', 25, yPosition);
      yPosition += 5;
      
      const errorLines = doc.splitTextToSize(item.error, pageWidth - 50);
      doc.text(errorLines, 30, yPosition);
      yPosition += errorLines.length * 4;
      doc.setTextColor(0, 0, 0);
    }

    yPosition += 10;
  });

  // 권장 사항 (상태에 따라)
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 10;
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommendations', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (overallStatus) {
    doc.setTextColor(0, 128, 0);
    doc.text('✓ System is ready for release. All checks have passed.', 20, yPosition);
    yPosition += 8;
    doc.setTextColor(0, 0, 0);
    doc.text('- Proceed with production deployment', 20, yPosition);
    yPosition += 6;
    doc.text('- Monitor system performance after release', 20, yPosition);
    yPosition += 6;
    doc.text('- Maintain regular backup schedules', 20, yPosition);
  } else {
    doc.setTextColor(255, 0, 0);
    doc.text('✗ System is NOT ready for release. Failed checks must be addressed.', 20, yPosition);
    yPosition += 8;
    doc.setTextColor(0, 0, 0);
    doc.text('- Fix all failed checklist items before proceeding', 20, yPosition);
    yPosition += 6;
    doc.text('- Re-run the checklist after fixes are implemented', 20, yPosition);
    yPosition += 6;
    doc.text('- Contact system administrator if issues persist', 20, yPosition);
  }

  // 푸터
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('TN Academy System Release Checklist Report', pageWidth / 2, footerY, { align: 'center' });

  // PDF 다운로드
  const fileName = `release-report-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.pdf`;
  doc.save(fileName);
};