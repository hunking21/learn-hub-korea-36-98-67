import type { ShortAnswerProcessingRule } from '@/types';

export interface ShortAnswerGradingUtils {
  checkAnswer: (userAnswer: string, correctAnswer: string | string[], rules: ShortAnswerProcessingRule) => boolean;
  addToAnswerKey: (currentAnswers: string[], newAnswer: string, rules: ShortAnswerProcessingRule) => string[];
  processAnswer: (answer: string, rules: ShortAnswerProcessingRule) => string;
  calculateLevenshteinDistance: (a: string, b: string) => number;
}

export const shortAnswerGradingUtils: ShortAnswerGradingUtils = {
  processAnswer(answer: string, rules: ShortAnswerProcessingRule): string {
    let processed = answer;
    
    if (rules.ignoreWhitespace) {
      processed = processed.trim();
    }
    
    if (rules.ignoreCase) {
      processed = processed.toLowerCase();
    }
    
    return processed;
  },

  calculateLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  },

  checkAnswer(userAnswer: string, correctAnswers: string | string[], rules: ShortAnswerProcessingRule): boolean {
    const processedUserAnswer = this.processAnswer(userAnswer, rules);
    const answersArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
    
    // Check exact matches with processing rules
    for (const correctAnswer of answersArray) {
      const processedCorrectAnswer = this.processAnswer(correctAnswer, rules);
      
      if (processedUserAnswer === processedCorrectAnswer) {
        return true;
      }
      
      // Check typo tolerance
      if (rules.typoTolerance > 0) {
        const distance = this.calculateLevenshteinDistance(processedUserAnswer, processedCorrectAnswer);
        if (distance <= rules.typoTolerance) {
          return true;
        }
      }
    }
    
    // Check regex patterns
    for (const pattern of rules.regexPatterns) {
      try {
        const regex = new RegExp(pattern, rules.ignoreCase ? 'i' : '');
        if (regex.test(userAnswer)) {
          return true;
        }
      } catch (error) {
        console.warn('Invalid regex pattern:', pattern, error);
      }
    }
    
    return false;
  },

  addToAnswerKey(currentAnswers: string[], newAnswer: string, rules: ShortAnswerProcessingRule): string[] {
    const processedNewAnswer = this.processAnswer(newAnswer, rules);
    
    // Check if the answer already exists (with processing)
    for (const existing of currentAnswers) {
      const processedExisting = this.processAnswer(existing, rules);
      if (processedExisting === processedNewAnswer) {
        return currentAnswers; // Already exists
      }
    }
    
    // Add the original (unprocessed) answer to maintain user input
    return [...currentAnswers, newAnswer];
  }
};