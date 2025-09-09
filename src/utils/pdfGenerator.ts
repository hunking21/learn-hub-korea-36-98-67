import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import type { TestAttempt, Test, TestVersion, Question } from '@/types';

export interface PDFGenerationOptions {
  attempt: TestAttempt;
  test: Test;
  version: TestVersion;
  sectionResults?: Array<{
    section: any;
    totalQuestions: number;
    totalPoints: number;
    earnedPoints: number;
    correctAnswers: number;
    incorrectAnswers: number;
    pendingReview: number;
  }>;
}

export class PDFGenerator {
  private static async generateQRCode(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return '';
    }
  }

  static async generateScoreReport(options: PDFGenerationOptions): Promise<void> {
    const { attempt, test, version, sectionResults = [] } = options;
    
    // Create a temporary container for PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.minHeight = '297mm'; // A4 height
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20mm';
    tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // Generate QR code for result link
    const resultUrl = `${window.location.origin}/s/result/${attempt.id}`;
    const qrCodeDataUrl = await this.generateQRCode(resultUrl);
    
    // Create PDF content
    tempContainer.innerHTML = this.createPDFContent({
      attempt,
      test,
      version,
      sectionResults,
      qrCodeDataUrl,
      resultUrl
    });
    
    document.body.appendChild(tempContainer);
    
    try {
      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels (210mm at 96dpi * 3.78)
        height: 1123 // A4 height in pixels (297mm at 96dpi * 3.78)
      });
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download PDF
      const candidateName = attempt.candidate?.name || 'Unknown';
      const testName = test.name.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const fileName = `성적표_${candidateName}_${testName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw new Error('PDF 생성에 실패했습니다.');
    } finally {
      document.body.removeChild(tempContainer);
    }
  }

  private static createPDFContent(data: {
    attempt: TestAttempt;
    test: Test;
    version: TestVersion;
    sectionResults: any[];
    qrCodeDataUrl: string;
    resultUrl: string;
  }): string {
    const { attempt, test, version, sectionResults, qrCodeDataUrl } = data;
    
    const scorePercentage = attempt.maxTotal ? Math.round((attempt.autoTotal || 0) / attempt.maxTotal * 100) : 0;
    const finalPercentage = attempt.maxTotal && attempt.finalTotal !== undefined 
      ? Math.round(attempt.finalTotal / attempt.maxTotal * 100) 
      : scorePercentage;

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.4; color: #1f2937;">
        <!-- Header with Logo -->
        <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
            <img src="/src/assets/tn-academy-logo.png" alt="TN Academy" style="height: 40px;" onerror="this.style.display='none'">
            <div>
              <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #1f2937;">성적표</h1>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Test Score Report</p>
            </div>
          </div>
        </div>

        <!-- Student Information -->
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #374151;">학생 정보</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>성명:</strong> ${attempt.candidate?.name || '-'}
            </div>
            <div>
              <strong>학제/학년:</strong> ${attempt.candidate ? `${attempt.candidate.system} ${attempt.candidate.grade}` : '-'}
            </div>
            <div>
              <strong>연락처:</strong> ${attempt.candidate?.phone || '-'}
            </div>
            <div>
              <strong>응시 ID:</strong> ${attempt.id}
            </div>
          </div>
          ${attempt.candidate?.note ? `
            <div style="margin-top: 15px;">
              <strong>특이사항:</strong> ${attempt.candidate.note}
            </div>
          ` : ''}
        </div>

        <!-- Test Information -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #374151;">시험 정보</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>시험명:</strong> ${test.name}
            </div>
            <div>
              <strong>버전:</strong> ${version.system} ${version.grade}
            </div>
            <div>
              <strong>시작 시간:</strong> ${new Date(attempt.startedAt).toLocaleString('ko-KR')}
            </div>
            <div>
              <strong>제출 시간:</strong> ${attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('ko-KR') : '-'}
            </div>
          </div>
        </div>

        <!-- Overall Score -->
        <div style="text-align: center; background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 20px 0; color: #374151;">총점</h2>
          <div style="font-size: 48px; font-weight: bold; color: ${finalPercentage >= 80 ? '#059669' : finalPercentage >= 60 ? '#d97706' : '#dc2626'}; margin-bottom: 10px;">
            ${finalPercentage}점
          </div>
          <div style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">
            ${attempt.finalTotal !== undefined ? attempt.finalTotal : attempt.autoTotal || 0} / ${attempt.maxTotal || 0}
          </div>
          <div style="background: #ffffff; height: 8px; border-radius: 4px; overflow: hidden; max-width: 300px; margin: 0 auto;">
            <div style="height: 100%; background: ${finalPercentage >= 80 ? '#10b981' : finalPercentage >= 60 ? '#f59e0b' : '#ef4444'}; width: ${finalPercentage}%; transition: all 0.3s ease;"></div>
          </div>
        </div>

        <!-- Section Results -->
        ${sectionResults.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #374151;">섹션별 상세 결과</h2>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600;">섹션</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">문항 수</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">정답</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">오답</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">점수</th>
                  </tr>
                </thead>
                <tbody>
                  ${sectionResults.map((result, index) => `
                    <tr ${index % 2 === 1 ? 'style="background: #f9fafb;"' : ''}>
                      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6;">${result.section.label || result.section.type}</td>
                      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f3f4f6;">${result.totalQuestions}</td>
                      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #059669;">${result.correctAnswers}</td>
                      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #dc2626;">${result.incorrectAnswers}</td>
                      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f3f4f6; font-weight: 600;">${result.earnedPoints} / ${result.totalPoints}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Wrong Answer Analysis -->
        ${this.generateWrongAnswerSection(attempt, version)}

        <!-- Speaking Assessment (if any) -->
        ${this.generateSpeakingSection(attempt, version)}

        <!-- QR Code and Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
            ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" style="width: 80px; height: 80px;">` : ''}
            <div style="text-align: left;">
              <p style="margin: 0; font-size: 11px; color: #6b7280;">온라인 결과 확인</p>
              <p style="margin: 5px 0; font-size: 10px; color: #9ca3af; word-break: break-all;">${data.resultUrl}</p>
              <p style="margin: 5px 0 0 0; font-size: 10px; color: #9ca3af;">생성일: ${new Date().toLocaleString('ko-KR')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private static generateWrongAnswerSection(attempt: TestAttempt, version: TestVersion): string {
    if (!version.sections || !attempt.answers) return '';

    const wrongAnswers: Array<{
      sectionLabel: string;
      questionNumber: number;
      question: Question;
      userAnswer: string;
      correctAnswer: string;
    }> = [];

    let questionCounter = 1;
    version.sections.forEach(section => {
      section.questions?.forEach(question => {
        const userAnswer = attempt.answers![question.id];
        let isWrong = false;
        let correctAnswer = '';

        if (question.type === 'MCQ' && question.choices && typeof question.answer === 'number') {
          const selectedIndex = question.choices.indexOf(userAnswer);
          if (selectedIndex !== question.answer) {
            isWrong = true;
            correctAnswer = question.choices[question.answer];
          }
        } else if (question.type === 'Short' && question.answer) {
          const answerString = Array.isArray(question.answer) 
            ? question.answer[0] 
            : String(question.answer);
          if (userAnswer?.trim().toLowerCase() !== answerString.toLowerCase()) {
            isWrong = true;
            correctAnswer = answerString;
          }
        }

        if (isWrong) {
          wrongAnswers.push({
            sectionLabel: section.label || section.type,
            questionNumber: questionCounter,
            question,
            userAnswer: userAnswer || '무응답',
            correctAnswer
          });
        }
        questionCounter++;
      });
    });

    if (wrongAnswers.length === 0) {
      return `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #374151;">오답노트</h2>
          <div style="text-align: center; padding: 40px; background: #f0fdf4; border-radius: 8px; color: #166534;">
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">🎉 완벽합니다!</div>
            <div>모든 문항을 정확하게 답했습니다.</div>
          </div>
        </div>
      `;
    }

    return `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #374151;">오답노트</h2>
        <div style="space-y: 20px;">
          ${wrongAnswers.map((item, index) => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; ${index > 0 ? 'margin-top: 20px;' : ''}">
              <div style="font-weight: 600; color: #374151; margin-bottom: 10px;">
                문제 ${item.questionNumber} (${item.sectionLabel})
              </div>
              <div style="margin-bottom: 15px; line-height: 1.6;">
                <strong>문제:</strong> ${item.question.prompt}
              </div>
              ${item.question.choices ? `
                <div style="margin-bottom: 15px;">
                  <strong>선택지:</strong>
                  <div style="margin-top: 5px;">
                    ${item.question.choices.map((choice, idx) => `
                      <div style="margin: 3px 0; padding: 5px 10px; border-radius: 4px; ${choice === item.correctAnswer ? 'background: #dcfce7; color: #166534;' : choice === item.userAnswer ? 'background: #fef2f2; color: #dc2626;' : 'background: #f9fafb;'}">
                        ${idx + 1}. ${choice} ${choice === item.correctAnswer ? '(정답)' : choice === item.userAnswer ? '(내 답)' : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : `
                <div style="margin-bottom: 15px;">
                  <div style="margin-bottom: 8px;"><strong>내 답:</strong> <span style="color: #dc2626;">${item.userAnswer}</span></div>
                  <div><strong>정답:</strong> <span style="color: #166534;">${item.correctAnswer}</span></div>
                </div>
              `}
              <!-- Note: Explanation feature not yet implemented -->
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private static generateSpeakingSection(attempt: TestAttempt, version: TestVersion): string {
    if (!version.sections) return '';

    const speakingQuestions: Question[] = [];
    version.sections.forEach(section => {
      section.questions?.forEach(question => {
        if (question.type === 'Speaking') {
          speakingQuestions.push(question);
        }
      });
    });

    if (speakingQuestions.length === 0) return '';

    const speakingReviews = attempt.speakingReviews || [];
    const rubrics = attempt.rubric || {};

    return `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #374151;">Speaking 평가 결과</h2>
        
        <!-- Evaluation Criteria -->
        <div style="background: #fefce8; border: 1px solid #facc15; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 10px 0; color: #92400e;">평가 기준표</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px;">
            <div><strong>Fluency (25%)</strong><br>유창성과 말하기 속도</div>
            <div><strong>Pronunciation (25%)</strong><br>정확한 발음과 억양</div>
            <div><strong>Grammar (25%)</strong><br>정확한 문법 사용</div>
            <div><strong>Content (25%)</strong><br>내용의 적절성과 창의성</div>
          </div>
        </div>

        <div style="space-y: 20px;">
          ${speakingQuestions.map((question, index) => {
            const review = speakingReviews.find(r => r.questionId === question.id);
            const rubric = rubrics[question.id];
            
            return `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; ${index > 0 ? 'margin-top: 20px;' : ''}">
                <div style="font-weight: 600; color: #374151; margin-bottom: 10px;">
                  Speaking 문제 ${index + 1} (${question.points}점 만점)
                </div>
                <div style="margin-bottom: 15px; line-height: 1.6;">
                  <strong>문제:</strong> ${question.prompt}
                </div>
                <div style="margin-bottom: 15px;">
                  <strong>응답 상태:</strong> ${attempt.answers?.[question.id] === 'recorded' ? '✓ 녹음 완료' : '응답 없음'}
                </div>
                
                ${rubric ? `
                  <!-- Rubric Scores -->
                  <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <h4 style="font-weight: 600; margin-bottom: 10px; font-size: 13px;">Rubric 평가</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 11px;">
                      ${rubric.criteria.map(criterion => {
                        const labels = {
                          fluency: 'Fluency (유창성)',
                          pronunciation: 'Pronunciation (발음)',
                          grammar: 'Grammar (문법)',
                          content: 'Content (내용)'
                        };
                        return `
                          <div style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">
                            <div style="font-weight: 600; color: #374151;">${labels[criterion.key]}</div>
                            <div style="margin-top: 2px;">
                              <span style="color: ${criterion.score >= 3 ? '#059669' : criterion.score >= 2 ? '#d97706' : '#dc2626'}; font-weight: bold;">
                                ${criterion.score}/4
                              </span>
                              <span style="color: #6b7280; margin-left: 8px;">(${criterion.weight}%)</span>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                ` : ''}
                
                <div style="background: #f1f5f9; padding: 15px; border-radius: 6px;">
                  <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px;">
                    <div>
                      <div style="font-weight: 600; margin-bottom: 5px;">총점: ${review?.manualScore || 0} / ${question.points}</div>
                      <div style="color: ${(review?.manualScore || 0) >= question.points * 0.8 ? '#059669' : (review?.manualScore || 0) >= question.points * 0.6 ? '#d97706' : '#dc2626'}; font-size: 11px;">
                        ${(review?.manualScore || 0) >= question.points * 0.8 ? '우수' : (review?.manualScore || 0) >= question.points * 0.6 ? '보통' : '개선 필요'}
                      </div>
                    </div>
                    <div>
                      <div style="font-weight: 600; margin-bottom: 5px;">교사 코멘트:</div>
                      <div style="font-size: 11px; color: #4b5563; line-height: 1.5;">
                        ${rubric?.comment || review?.comment || '검토 대기 중입니다.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        ${Object.keys(rubrics).length > 0 ? `
          <!-- Rubric Summary -->
          <div style="margin-top: 20px; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px;">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 10px 0; color: #1e40af;">Rubric 종합 평가</h3>
            <div style="font-size: 12px; color: #1f2937;">
              본 평가는 Speaking 능력을 4개 영역(Fluency, Pronunciation, Grammar, Content)으로 나누어 
              0-4점 척도로 측정한 결과입니다. 각 영역별 가중치를 적용하여 최종 점수를 산출했습니다.
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  static async generateBulkPDFs(attempts: PDFGenerationOptions[]): Promise<void> {
    if (attempts.length === 0) {
      throw new Error('생성할 PDF가 없습니다.');
    }

    const zip = new JSZip();
    const loadingToastId = Date.now().toString();

    try {
      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        
        // Create PDF content for each attempt
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.width = '210mm';
        tempContainer.style.minHeight = '297mm';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.padding = '20mm';
        tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        
        const resultUrl = `${window.location.origin}/s/result/${attempt.attempt.id}`;
        const qrCodeDataUrl = await this.generateQRCode(resultUrl);
        
        tempContainer.innerHTML = this.createPDFContent({
          attempt: attempt.attempt,
          test: attempt.test,
          version: attempt.version,
          sectionResults: attempt.sectionResults || [],
          qrCodeDataUrl,
          resultUrl
        });
        
        document.body.appendChild(tempContainer);
        
        try {
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: 1123
          });
          
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;
          
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          const candidateName = attempt.attempt.candidate?.name || 'Unknown';
          const testName = attempt.test.name.replace(/[^a-zA-Z0-9가-힣]/g, '_');
          const fileName = `성적표_${candidateName}_${testName}.pdf`;
          
          // Add to ZIP
          const pdfBlob = pdf.output('blob');
          zip.file(fileName, pdfBlob);
          
        } finally {
          document.body.removeChild(tempContainer);
        }
      }
      
      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `성적표_일괄다운로드_${new Date().toISOString().split('T')[0]}.zip`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to generate bulk PDFs:', error);
      throw new Error('일괄 PDF 생성에 실패했습니다.');
    }
  }
}