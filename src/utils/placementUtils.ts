import type { TestAttempt, PlacementConfig, PlacementRecommendation, PlacementLevel } from '@/types';

export const placementUtils = {
  /**
   * 시험 결과를 바탕으로 배치 권고를 계산합니다.
   */
  calculatePlacement(
    attempt: TestAttempt, 
    config: PlacementConfig
  ): PlacementRecommendation | null {
    const { finalTotal, maxTotal, speakingReviews } = attempt;
    
    if (!finalTotal || !maxTotal) {
      return null;
    }

    // 총점 계산 (100점 만점으로 변환)
    const totalScore = Math.round((finalTotal / maxTotal) * 100);
    
    // 스피킹 평균 점수 계산 (4점 만점)
    let speakingScore: number | undefined;
    let maxSpeakingScore: number | undefined;
    
    if (speakingReviews && speakingReviews.length > 0) {
      const totalSpeakingScore = speakingReviews.reduce((sum, review) => sum + review.manualScore, 0);
      const maxPossibleSpeakingScore = speakingReviews.length * 4; // 4점 만점
      speakingScore = Number((totalSpeakingScore / speakingReviews.length).toFixed(1));
      maxSpeakingScore = 4;
    }

    // 기준에 따라 레벨 결정 (높은 레벨부터 검사)
    const sortedCriteria = [...config.criteria].sort((a, b) => b.minTotalScore - a.minTotalScore);
    
    let recommendedLevel: PlacementLevel = 'Starter';
    let reason = '';
    let confidence: 'high' | 'medium' | 'low' = 'high';

    for (const criteria of sortedCriteria) {
      const meetsTotalScore = totalScore >= criteria.minTotalScore;
      const meetsSpeakingScore = !criteria.minSpeakingScore || 
        (speakingScore !== undefined && speakingScore >= criteria.minSpeakingScore);

      if (meetsTotalScore && meetsSpeakingScore) {
        recommendedLevel = criteria.level;
        reason = this.generateReason(criteria, totalScore, speakingScore);
        confidence = this.calculateConfidence(totalScore, speakingScore, criteria);
        break;
      }
    }

    return {
      level: recommendedLevel,
      totalScore,
      maxTotalScore: 100,
      speakingScore,
      maxSpeakingScore,
      reason,
      confidence
    };
  },

  /**
   * 권고 이유를 생성합니다.
   */
  generateReason(
    criteria: { level: PlacementLevel; minTotalScore: number; minSpeakingScore?: number; description: string },
    totalScore: number,
    speakingScore?: number
  ): string {
    const parts = [
      `총점 ${totalScore}점 (기준: ${criteria.minTotalScore}점 이상)`
    ];

    if (criteria.minSpeakingScore && speakingScore !== undefined) {
      parts.push(`스피킹 평균 ${speakingScore}점 (기준: ${criteria.minSpeakingScore}점 이상)`);
    }

    return parts.join(', ');
  },

  /**
   * 권고의 신뢰도를 계산합니다.
   */
  calculateConfidence(
    totalScore: number,
    speakingScore: number | undefined,
    criteria: { minTotalScore: number; minSpeakingScore?: number }
  ): 'high' | 'medium' | 'low' {
    const totalMargin = totalScore - criteria.minTotalScore;
    const speakingMargin = speakingScore && criteria.minSpeakingScore ? 
      speakingScore - criteria.minSpeakingScore : 0;

    // 기준점보다 충분히 높으면 high confidence
    if (totalMargin >= 15 && speakingMargin >= 0.5) {
      return 'high';
    }
    // 기준점에 근접하면 medium confidence  
    if (totalMargin >= 5 && speakingMargin >= 0) {
      return 'medium';
    }
    // 기준점에 아슬아슬하면 low confidence
    return 'low';
  },

  /**
   * 레벨의 한글 이름을 반환합니다.
   */
  getLevelName(level: PlacementLevel): string {
    const names = {
      'Starter': '입문',
      'Basic': '초급',
      'Intermediate': '중급', 
      'Advanced': '고급'
    };
    return names[level];
  },

  /**
   * 레벨의 색상을 반환합니다.
   */
  getLevelColor(level: PlacementLevel): string {
    const colors = {
      'Starter': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'Basic': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Intermediate': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[level];
  },

  /**
   * 신뢰도의 색상을 반환합니다.
   */
  getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
    const colors = {
      'high': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
      'medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200', 
      'low': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
    };
    return colors[confidence];
  },

  /**
   * 신뢰도의 한글 이름을 반환합니다.
   */
  getConfidenceName(confidence: 'high' | 'medium' | 'low'): string {
    const names = {
      'high': '높음',
      'medium': '보통',
      'low': '낮음'
    };
    return names[confidence];
  }
};