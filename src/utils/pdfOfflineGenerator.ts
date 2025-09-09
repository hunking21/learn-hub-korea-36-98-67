import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { TestVersion } from '@/hooks/useTestVersions';

interface OfflinePDFData {
  testId: string;
  versionId: string;
  layoutSeed: number;
  numQuestions: number;
  testName: string;
  gradeLevel: string;
  systemType: string;
  sections: {
    type: string;
    questions: Array<{
      id: string;
      type: 'MCQ' | 'Short' | 'Speaking';
      prompt: string;
      choices?: string[];
    }>;
  }[];
}

export const generateOfflinePDF = async (data: OfflinePDFData): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;

  // QR 코드 데이터
  const qrData = JSON.stringify({
    testId: data.testId,
    versionId: data.versionId,
    layoutSeed: data.layoutSeed,
    numQuestions: data.numQuestions
  });

  try {
    // QR 코드 생성
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 100,
      margin: 2
    });

    // 헤더 정보
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${data.testName} - 오프라인 응답지`, margin, margin);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`학년: ${data.gradeLevel} | 시스템: ${data.systemType}`, margin, margin + 10);
    pdf.text(`시험 ID: ${data.testId.slice(0, 8)}... | 버전 ID: ${data.versionId.slice(0, 8)}...`, margin, margin + 20);

    // QR 코드 추가
    pdf.addImage(qrCodeDataURL, 'PNG', pageWidth - 50, margin, 30, 30);

    // 학생 정보 입력란
    let currentY = margin + 40;
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    
    pdf.text('학생 정보:', margin, currentY);
    currentY += 10;
    
    // 이름, 학번 입력칸
    pdf.text('이름: ________________________', margin, currentY);
    pdf.text('학번: ________________________', margin + 100, currentY);
    currentY += 20;

    // 문제별 답안 영역
    let questionNum = 1;
    
    for (const section of data.sections) {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }

      // 섹션 헤더
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${section.type} 섹션`, margin, currentY);
      currentY += 15;
      pdf.setFont('helvetica', 'normal');

      for (const question of section.questions) {
        if (currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = margin;
        }

        if (question.type === 'MCQ') {
          // MCQ OMR 그리드
          pdf.text(`${questionNum}. MCQ`, margin, currentY);
          
          // OMR 원형 그리드 (A, B, C, D, E)
          const choices = ['A', 'B', 'C', 'D', 'E'];
          let startX = margin + 50;
          
          for (let i = 0; i < choices.length; i++) {
            const x = startX + (i * 20);
            // 원 그리기
            pdf.circle(x, currentY - 2, 3, 'S');
            pdf.text(choices[i], x - 2, currentY + 8);
          }
          currentY += 20;

        } else if (question.type === 'Short') {
          // Short Answer 답안칸
          pdf.text(`${questionNum}. Short Answer`, margin, currentY);
          currentY += 10;
          
          // 답안 작성란
          for (let i = 0; i < 3; i++) {
            pdf.line(margin, currentY + (i * 8), pageWidth - margin, currentY + (i * 8));
          }
          currentY += 30;

        } else if (question.type === 'Speaking') {
          // Speaking 지시문
          pdf.text(`${questionNum}. Speaking`, margin, currentY);
          currentY += 10;
          
          pdf.setFontSize(10);
          const instructions = [
            '• 음성 녹음 장비를 준비하세요',
            '• 문제를 읽고 30초간 준비 시간을 가지세요', 
            '• 90초간 응답을 녹음하세요',
            '• 녹음 파일명: Q' + questionNum + '_[학번]_[이름].mp3'
          ];
          
          instructions.forEach(instruction => {
            pdf.text(instruction, margin, currentY);
            currentY += 6;
          });
          
          pdf.setFontSize(12);
          currentY += 10;
        }

        questionNum++;
      }
    }

    // 하단 안내사항
    if (currentY > pageHeight - 60) {
      pdf.addPage();
      currentY = margin;
    }

    currentY = pageHeight - 50;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('* 모든 답안을 명확히 표시하세요. OMR은 진한 연필(2B)을 사용하세요.', margin, currentY);
    pdf.text('* 답안지를 스캔하여 업로드할 때 QR 코드가 선명하게 보이도록 하세요.', margin, currentY + 10);

    // PDF 저장
    const fileName = `${data.testName}_${data.gradeLevel}_오프라인응답지.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('PDF 생성 중 오류:', error);
    throw new Error('PDF 생성에 실패했습니다.');
  }
};