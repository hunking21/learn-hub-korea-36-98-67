import { useState, useEffect } from 'react';
import { memoryRepo } from '@/repositories/memoryRepo';
import type { QuestionBankItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

export interface QuestionBankFilters {
  search: string;
  type: string;
  difficulty: string;
  tags: string[];
  category: string;
}

export const useQuestionBank = () => {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([]);
  const [filters, setFilters] = useState<QuestionBankFilters>({
    search: '',
    type: '',
    difficulty: '',
    tags: [],
    category: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const data = await memoryRepo.getQuestionBank();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast({
        title: "오류",
        description: "문항을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.prompt.toLowerCase().includes(searchLower) ||
        q.choices?.some(choice => choice.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(q => q.type === filters.type);
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(q => q.difficulty === filters.difficulty);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(q => 
        filters.tags.some(tag => q.tags.includes(tag))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(q => q.category === filters.category);
    }

    setFilteredQuestions(filtered);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, filters]);

  const addQuestion = async (questionData: Omit<QuestionBankItem, 'id' | 'createdAt'>) => {
    try {
      await memoryRepo.addQuestionToBank(questionData);
      await fetchQuestions();
      toast({
        title: "성공",
        description: "문항이 성공적으로 추가되었습니다.",
      });
      return true;
    } catch (error) {
      console.error('Failed to add question:', error);
      toast({
        title: "오류",
        description: "문항 추가에 실패했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Omit<QuestionBankItem, 'id' | 'createdAt'>>) => {
    try {
      await memoryRepo.updateQuestionInBank(id, updates);
      await fetchQuestions();
      toast({
        title: "성공",
        description: "문항이 성공적으로 수정되었습니다.",
      });
      return true;
    } catch (error) {
      console.error('Failed to update question:', error);
      toast({
        title: "오류",
        description: "문항 수정에 실패했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await memoryRepo.deleteQuestionFromBank(id);
      await fetchQuestions();
      setSelectedQuestions(prev => prev.filter(qId => qId !== id));
      toast({
        title: "성공",
        description: "문항이 성공적으로 삭제되었습니다.",
      });
      return true;
    } catch (error) {
      console.error('Failed to delete question:', error);
      toast({
        title: "오류",
        description: "문항 삭제에 실패했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const exportQuestions = async () => {
    try {
      const data = await memoryRepo.exportQuestionBank();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-bank-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "성공",
        description: "문제은행이 내보내기 되었습니다.",
      });
    } catch (error) {
      console.error('Failed to export questions:', error);
      toast({
        title: "오류",
        description: "내보내기에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const importQuestions = async (file: File) => {
    try {
      const text = await file.text();
      const result = await memoryRepo.importQuestionBank(text);
      
      if (result.success) {
        await fetchQuestions();
        toast({
          title: "성공",
          description: result.message,
        });
      } else {
        toast({
          title: "오류",
          description: result.message,
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to import questions:', error);
      toast({
        title: "오류",
        description: "가져오기에 실패했습니다.",
        variant: "destructive",
      });
      return { success: false, message: '파일 읽기 실패', imported: 0 };
    }
  };

  const addQuestionsToSection = async (testId: string, versionId: string, sectionId: string, questionIds: string[]) => {
    try {
      await memoryRepo.addQuestionsToSection(testId, versionId, sectionId, questionIds);
      setSelectedQuestions([]);
      toast({
        title: "성공",
        description: `${questionIds.length}개의 문항이 섹션에 추가되었습니다.`,
      });
      return true;
    } catch (error) {
      console.error('Failed to add questions to section:', error);
      toast({
        title: "오류",
        description: "문항을 섹션에 추가하는데 실패했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredQuestions.map(q => q.id);
    setSelectedQuestions(visibleIds);
  };

  const clearSelection = () => {
    setSelectedQuestions([]);
  };

  // Get all unique tags
  const allTags = Array.from(new Set(questions.flatMap(q => q.tags))).sort();
  
  // Get all unique categories  
  const allCategories = Array.from(new Set(questions.map(q => q.category).filter(Boolean))).sort();

  const getRecentlyUsedQuestionPrompts = async (): Promise<string[]> => {
    try {
      return await memoryRepo.getRecentlyUsedQuestionPrompts();
    } catch (error) {
      console.error('Failed to get recently used prompts:', error);
      return [];
    }
  };

  return {
    questions: filteredQuestions,
    allQuestions: questions,
    filters,
    setFilters,
    isLoading,
    selectedQuestions,
    allTags,
    allCategories,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    exportQuestions,
    importQuestions,
    addQuestionsToSection,
    toggleQuestionSelection,
    selectAllVisible,
    clearSelection,
    refresh: fetchQuestions,
  };
};