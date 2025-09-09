import type { QuestionBankItem } from '@/types';

interface GenerationParams {
  system: 'KR' | 'US' | 'UK';
  grade: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  count: number;
  seed: number;
}

interface GeneratedQuestion {
  prompt: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  category: string;
}

const TOPICS = [
  '자기소개', '가족', '친구', '취미', '학교생활', '음식', '여행', '날씨', '스포츠', '영화',
  '음악', '책', '미래 계획', '직업', '쇼핑', '건강', '환경', '기술', '문화', '언어학습'
];

const SITUATIONS = [
  '처음 만나는 사람과', '친구와 대화할 때', '가족과 함께할 때', '학교에서', '집에서',
  '카페에서', '여행지에서', '쇼핑몰에서', '병원에서', '도서관에서', '공원에서',
  '파티에서', '식당에서', '버스/지하철에서', '온라인으로', '전화로', '이메일로',
  '발표할 때', '면접에서', '수업시간에'
];

const ACTIONS = {
  Easy: [
    '간단히 설명해 보세요',
    '이야기해 주세요',
    '소개해 보세요',
    '말해 보세요',
    '표현해 보세요'
  ],
  Medium: [
    '자세히 설명하고 이유를 말해 보세요',
    '경험을 바탕으로 이야기해 보세요',
    '비교하여 설명해 보세요',
    '장단점을 말해 보세요',
    '본인의 의견을 제시해 보세요'
  ],
  Hard: [
    '구체적인 예시를 들어 논리적으로 설명해 보세요',
    '다양한 관점에서 분석하고 의견을 제시해 보세요',
    '문제점을 파악하고 해결방안을 제안해 보세요',
    '미래 전망과 함께 종합적으로 평가해 보세요',
    '반대 의견에 대한 반박과 함께 주장을 펼쳐보세요'
  ]
};

const POINTS_BY_DIFFICULTY = {
  Easy: 5,
  Medium: 10,
  Hard: 15
};

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

function getGradeTags(system: 'KR' | 'US' | 'UK', grade: string): string[] {
  const tags = [`${system}_${grade}`, system];
  
  if (system === 'KR') {
    if (['초1', '초2', '초3'].includes(grade)) {
      tags.push('초등저학년');
    } else if (['초4', '초5', '초6'].includes(grade)) {
      tags.push('초등고학년');
    } else if (['중1', '중2', '중3'].includes(grade)) {
      tags.push('중학교');
    } else if (['고1', '고2', '고3'].includes(grade)) {
      tags.push('고등학교');
    }
  }
  
  return tags;
}

function generateCombinations(
  topics: string[],
  situations: string[],
  actions: string[],
  count: number,
  random: SeededRandom
): Array<{ topic: string; situation: string; action: string }> {
  const combinations: Array<{ topic: string; situation: string; action: string }> = [];
  const used = new Set<string>();

  while (combinations.length < count) {
    const topic = topics[random.nextInt(topics.length)];
    const situation = situations[random.nextInt(situations.length)];
    const action = actions[random.nextInt(actions.length)];
    
    const key = `${topic}|${situation}|${action}`;
    
    if (!used.has(key)) {
      used.add(key);
      combinations.push({ topic, situation, action });
    }
  }

  return combinations;
}

export function generateSpeakingQuestions(
  params: GenerationParams,
  excludePrompts: string[] = []
): GeneratedQuestion[] {
  const { system, grade, difficulty, count, seed } = params;
  const random = new SeededRandom(seed);

  const shuffledTopics = random.shuffle(TOPICS);
  const shuffledSituations = random.shuffle(SITUATIONS);
  const actions = ACTIONS[difficulty];
  
  const combinations = generateCombinations(
    shuffledTopics,
    shuffledSituations,
    actions,
    count * 3, // Generate more combinations than needed for filtering
    random
  );

  const questions: GeneratedQuestion[] = [];
  const usedPrompts = new Set(excludePrompts);

  for (const { topic, situation, action } of combinations) {
    if (questions.length >= count) break;

    const prompt = `${topic}에 대해 ${situation} ${action}.`;
    
    // Skip if prompt already exists
    if (usedPrompts.has(prompt)) continue;
    
    usedPrompts.add(prompt);
    
    const gradeTags = getGradeTags(system, grade);
    
    questions.push({
      prompt,
      points: POINTS_BY_DIFFICULTY[difficulty],
      difficulty,
      tags: [...gradeTags, 'Speaking', difficulty, topic],
      category: `Speaking_${difficulty}_${system}`
    });
  }

  return questions;
}

export function convertToQuestionBankItems(
  generatedQuestions: GeneratedQuestion[]
): Omit<QuestionBankItem, 'id' | 'createdAt'>[] {
  return generatedQuestions.map(q => ({
    type: 'Speaking' as const,
    prompt: q.prompt,
    points: q.points,
    difficulty: q.difficulty,
    tags: q.tags,
    category: q.category
  }));
}