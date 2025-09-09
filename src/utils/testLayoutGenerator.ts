import type { TestVersion, TestAttempt } from "@/types";

// 시드를 기반으로 한 간단한 PRNG (Pseudo Random Number Generator)
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // 0과 1 사이의 난수 생성
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // min과 max 사이의 정수 생성
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // 배열 섞기 (Fisher-Yates shuffle)
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export function generateTestLayout(
  version: TestVersion, 
  attemptId: string, 
  userId: string = 'anonymous'
): TestAttempt['layout'] {
  const options = version.examOptions;
  
  // 응시 옵션이 모두 false이거나 없으면 레이아웃 생성하지 않음
  if (!options || (!options.shuffleQuestions && !options.shuffleChoices)) {
    return undefined;
  }

  // 시드 생성: attemptId와 userId 조합으로 고정 시드 생성
  const seedString = `${attemptId}-${userId}`;
  const seed = seedString
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const rng = new SeededRandom(seed);
  const layout: NonNullable<TestAttempt['layout']> = {
    seed
  };

  // 문항 순서 섞기
  if (options.shuffleQuestions && version.sections) {
    const shuffledQuestions: Array<{
      sectionId: string;
      originalIndex: number;
      shuffledIndex: number;
    }> = [];

    version.sections.forEach((section) => {
      if (section.questions && section.questions.length > 0) {
        const questionIndices = Array.from(
          { length: section.questions.length }, 
          (_, i) => i
        );
        const shuffledIndices = rng.shuffle(questionIndices);
        
        shuffledIndices.forEach((shuffledIndex, originalIndex) => {
          shuffledQuestions.push({
            sectionId: section.id,
            originalIndex,
            shuffledIndex
          });
        });
      }
    });

    layout.shuffledQuestions = shuffledQuestions;
  }

  // 선택지 순서 섞기
  if (options.shuffleChoices && version.sections) {
    const shuffledChoices: Record<string, number[]> = {};

    version.sections.forEach((section) => {
      if (section.questions) {
        section.questions.forEach((question) => {
          if (question.type === 'MCQ' && question.choices && question.choices.length > 0) {
            const choiceIndices = Array.from(
              { length: question.choices.length }, 
              (_, i) => i
            );
            shuffledChoices[question.id] = rng.shuffle(choiceIndices);
          }
        });
      }
    });

    layout.shuffledChoices = shuffledChoices;
  }

  return layout;
}

// 레이아웃을 적용하여 섞인 순서대로 문제와 선택지를 반환
export function applyTestLayout(
  version: TestVersion, 
  layout?: TestAttempt['layout']
): TestVersion {
  if (!layout || !version.sections) {
    return version;
  }

  const appliedVersion: TestVersion = {
    ...version,
    sections: version.sections.map((section) => {
      if (!section.questions) return section;

      // 문항 순서 적용
      let orderedQuestions = [...section.questions];
      
      if (layout.shuffledQuestions) {
        const sectionShuffleData = layout.shuffledQuestions.filter(
          sq => sq.sectionId === section.id
        );
        
        if (sectionShuffleData.length > 0) {
          orderedQuestions = Array(section.questions.length);
          sectionShuffleData.forEach(({ originalIndex, shuffledIndex }) => {
            if (section.questions && section.questions[originalIndex]) {
              orderedQuestions[shuffledIndex] = section.questions[originalIndex];
            }
          });
          // null/undefined 제거
          orderedQuestions = orderedQuestions.filter(Boolean);
        }
      }

      // 선택지 순서 적용
      const questionsWithShuffledChoices = orderedQuestions.map((question) => {
        if (question.type === 'MCQ' && 
            question.choices && 
            layout.shuffledChoices?.[question.id]) {
          
          const shuffledIndices = layout.shuffledChoices[question.id];
          const shuffledChoices = shuffledIndices.map(index => question.choices![index]);
          
          // 정답 인덱스도 변경
          let newAnswerIndex = question.answer as number;
          if (typeof question.answer === 'number') {
            newAnswerIndex = shuffledIndices.indexOf(question.answer);
          }

          return {
            ...question,
            choices: shuffledChoices,
            answer: newAnswerIndex
          };
        }
        return question;
      });

      return {
        ...section,
        questions: questionsWithShuffledChoices
      };
    })
  };

  return appliedVersion;
}

// 미리보기용: 고정 시드로 레이아웃 생성 (메모리만)
export function generatePreviewLayout(version: TestVersion): TestVersion {
  const options = version.examOptions;
  
  if (!options || (!options.shuffleQuestions && !options.shuffleChoices)) {
    return version;
  }

  // 미리보기용 고정 시드
  const previewSeed = 12345;
  const rng = new SeededRandom(previewSeed);

  let appliedVersion = { ...version };

  if (!appliedVersion.sections) return appliedVersion;

  appliedVersion.sections = appliedVersion.sections.map((section) => {
    if (!section.questions) return section;

    let questions = [...section.questions];

    // 문항 순서 섞기 (미리보기)
    if (options.shuffleQuestions) {
      questions = rng.shuffle(questions);
    }

    // 선택지 순서 섞기 (미리보기)
    if (options.shuffleChoices) {
      questions = questions.map((question) => {
        if (question.type === 'MCQ' && question.choices && question.choices.length > 0) {
          const choiceIndices = Array.from({ length: question.choices.length }, (_, i) => i);
          const shuffledIndices = rng.shuffle(choiceIndices);
          const shuffledChoices = shuffledIndices.map(index => question.choices![index]);
          
          // 정답 인덱스 업데이트
          let newAnswerIndex = question.answer as number;
          if (typeof question.answer === 'number') {
            newAnswerIndex = shuffledIndices.indexOf(question.answer);
          }

          return {
            ...question,
            choices: shuffledChoices,
            answer: newAnswerIndex
          };
        }
        return question;
      });
    }

    return {
      ...section,
      questions
    };
  });

  return appliedVersion;
}