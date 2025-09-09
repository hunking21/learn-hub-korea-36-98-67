import { useQuery } from '@tanstack/react-query';

export interface ItemAnalysis {
  questionNumber: string;
  correctRate: number;
  discrimination: number;
  upperGroupCorrect: number;
  lowerGroupCorrect: number;
  optionDistribution: {
    option: string;
    count: number;
    percentage: number;
  }[];
  isLowDiscrimination: boolean;
}

export interface SectionAnalysis {
  sectionName: string;
  averageTime: number;
  medianTime: number;
  completionRate: number;
  totalAttempts: number;
}

export interface ScoreDistribution {
  scoreRange: string;
  count: number;
  percentage: number;
}

export interface TestAnalyticsData {
  itemAnalysis: ItemAnalysis[];
  sectionAnalysis: SectionAnalysis[];
  scoreDistribution: ScoreDistribution[];
  summary: {
    totalAttempts: number;
    averageScore: number;
    standardDeviation: number;
    reliability: number;
  };
}

interface UseTestAnalyticsDataParams {
  testId?: string;
  versionId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Mock data generator
const generateMockData = (params: UseTestAnalyticsDataParams): TestAnalyticsData => {
  // Generate item analysis
  const itemAnalysis: ItemAnalysis[] = Array.from({ length: 20 }, (_, i) => {
    const correctRate = 0.3 + Math.random() * 0.6; // 30-90% correct rate
    const upperGroup = correctRate + 0.1 + Math.random() * 0.2;
    const lowerGroup = correctRate - 0.1 - Math.random() * 0.2;
    const discrimination = Math.max(0, upperGroup - lowerGroup);
    
    return {
      questionNumber: `${i + 1}`,
      correctRate,
      discrimination,
      upperGroupCorrect: Math.min(1, upperGroup),
      lowerGroupCorrect: Math.max(0, lowerGroup),
      optionDistribution: [
        { option: 'A', count: Math.floor(Math.random() * 50), percentage: 0 },
        { option: 'B', count: Math.floor(Math.random() * 50), percentage: 0 },
        { option: 'C', count: Math.floor(Math.random() * 50), percentage: 0 },
        { option: 'D', count: Math.floor(Math.random() * 50), percentage: 0 },
      ].map(opt => {
        const total = 200;
        const percentage = (opt.count / total) * 100;
        return { ...opt, percentage };
      }),
      isLowDiscrimination: discrimination < 0.2
    };
  });

  // Generate section analysis
  const sectionAnalysis: SectionAnalysis[] = [
    {
      sectionName: '듣기',
      averageTime: 25.5,
      medianTime: 23.2,
      completionRate: 0.95,
      totalAttempts: 150
    },
    {
      sectionName: '문법',
      averageTime: 18.3,
      medianTime: 16.8,
      completionRate: 0.87,
      totalAttempts: 140
    },
    {
      sectionName: '독해',
      averageTime: 32.7,
      medianTime: 30.1,
      completionRate: 0.78,
      totalAttempts: 125
    },
    {
      sectionName: '쓰기',
      averageTime: 28.9,
      medianTime: 26.4,
      completionRate: 0.82,
      totalAttempts: 130
    }
  ];

  // Generate score distribution
  const scoreDistribution: ScoreDistribution[] = [
    { scoreRange: '0-10', count: 2, percentage: 1.3 },
    { scoreRange: '11-20', count: 5, percentage: 3.3 },
    { scoreRange: '21-30', count: 8, percentage: 5.3 },
    { scoreRange: '31-40', count: 12, percentage: 8.0 },
    { scoreRange: '41-50', count: 18, percentage: 12.0 },
    { scoreRange: '51-60', count: 25, percentage: 16.7 },
    { scoreRange: '61-70', count: 32, percentage: 21.3 },
    { scoreRange: '71-80', count: 28, percentage: 18.7 },
    { scoreRange: '81-90', count: 15, percentage: 10.0 },
    { scoreRange: '91-100', count: 5, percentage: 3.3 }
  ];

  return {
    itemAnalysis,
    sectionAnalysis,
    scoreDistribution,
    summary: {
      totalAttempts: 150,
      averageScore: 65.7,
      standardDeviation: 18.2,
      reliability: 0.84
    }
  };
};

export const useTestAnalyticsData = (params: UseTestAnalyticsDataParams) => {
  return useQuery({
    queryKey: ['test-analytics', params],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockData(params);
    },
    enabled: !!(params.testId && params.versionId),
  });
};