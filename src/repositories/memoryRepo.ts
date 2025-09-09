import type { Test, TestVersion, TestSection, Question, TestAssignment } from '@/types/schema';
import type { TestAttempt, SpeakingReview, SpeakingRubric, QuestionBankItem } from '@/types';
import { localStore } from '@/store/localStore';
import { userStore, User } from '@/store/userStore';

export const memoryRepo = {
  // Users management
  users: {
    getAll(): User[] {
      return userStore.getUsers();
    },
    
    getById(id: string): User | null {
      return userStore.getUsers().find(u => u.id === id) || null;
    },
    
    getByUsername(username: string): User | null {
      return userStore.getUserByUsername(username);
    },
    
    create(userData: Omit<User, 'id' | 'createdAt'>): User {
      return userStore.createUser(userData);
    },
    
    update(id: string, updates: Partial<User>): User {
      return userStore.updateUser(id, updates);
    },
    
    remove(id: string): void {
      userStore.deleteUser(id);
    },
    
    getStudents(): User[] {
      return userStore.getStudents();
    },
    
    getTeachers(): User[] {
      return userStore.getTeachers();
    },
    
    getAdmins(): User[] {
      return userStore.getAdmins();
    },
    
    authenticate(username: string, password: string): User | null {
      return userStore.authenticate(username, password);
    },
    
    resetPassword(id: string): string {
      return userStore.resetPassword(id);
    }
  },
  async listTests(): Promise<Test[]> {
    // 최신순 정렬해서 반환
    return localStore.getTests().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createTest(input: { name: string; description?: string }): Promise<Test> {
    const item: Test = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      versions: [],
    };
    localStore.addTest(item);
    return item;
  },
  async updateTest(id: string, input: { name: string; description?: string }): Promise<boolean> {
    return localStore.updateTest(id, (test) => ({
      ...test,
      name: input.name,
      description: input.description,
    }));
  },
  async deleteTest(id: string): Promise<boolean> {
    return localStore.deleteTest(id);
  },
  async addVersion(testId: string, input: { targets: Array<{system: 'KR' | 'US' | 'UK', grades: string[]}> }): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (!test.versions) test.versions = [];
        const version: TestVersion = {
          id: crypto.randomUUID(),
          targets: input.targets,
          createdAt: new Date().toISOString(),
          sections: [],
        };
      return {
        ...test,
        versions: [version, ...test.versions],
      };
    });
  },
  async addSection(testId: string, versionId: string, input: { label: string; type: 'Listening' | 'Reading' | 'Speaking' | 'Writing' | 'Custom'; timeLimit: number; settings?: any }): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1) {
          const version = test.versions[versionIndex];
          if (!version.sections) version.sections = [];
          const section: TestSection = {
            id: crypto.randomUUID(),
            label: input.label,
            type: input.type,
            timeLimit: input.timeLimit,
            createdAt: new Date().toISOString(),
            questions: [],
            settings: input.settings,
          };
          return {
            ...test,
            versions: test.versions.map((v, i) => 
              i === versionIndex ? { ...v, sections: [...v.sections, section] } : v
            )
          };
        }
      }
      return test;
    });
  },
  async updateSection(testId: string, versionId: string, sectionId: string, input: { label: string; type: 'Listening' | 'Reading' | 'Speaking' | 'Writing' | 'Custom'; timeLimit: number; settings?: any }): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1) {
            return {
              ...test,
              versions: test.versions.map((v, vi) => 
                vi === versionIndex ? {
                  ...v,
                  sections: v.sections.map((s, si) => 
                    si === sectionIndex ? { ...s, label: input.label, type: input.type, timeLimit: input.timeLimit, settings: input.settings } : s
                  )
                } : v
              )
            };
          }
        }
      }
      return test;
    });
  },
  async deleteSection(testId: string, versionId: string, sectionId: string): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const initialLength = test.versions[versionIndex].sections.length;
          const newSections = test.versions[versionIndex].sections.filter(s => s.id !== sectionId);
          if (newSections.length < initialLength) {
            return {
              ...test,
              versions: test.versions.map((v, vi) => 
                vi === versionIndex ? { ...v, sections: newSections } : v
              )
            };
          }
        }
      }
      return test;
    });
  },
  async applyTemplate(testId: string, versionId: string, templateName: string): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1) {
          let templateSections: TestSection[] = [];
          
          if (templateName === '영어 진단') {
            templateSections = [
              {
                id: crypto.randomUUID(),
                label: 'Listening',
                type: 'Listening',
                timeLimit: 20,
                createdAt: new Date().toISOString(),
                questions: [],
              },
              {
                id: crypto.randomUUID(),
                label: 'Reading',
                type: 'Reading',
                timeLimit: 25,
                createdAt: new Date().toISOString(),
                questions: [],
              },
              {
                id: crypto.randomUUID(),
                label: 'Speaking(인터뷰)',
                type: 'Speaking',
                timeLimit: 10,
                createdAt: new Date().toISOString(),
                questions: [],
              }
            ];
          }
          
          return {
            ...test,
            versions: test.versions.map((v, vi) => 
              vi === versionIndex ? { ...v, sections: templateSections } : v
            )
          };
        }
      }
      return test;
    });
  },
  async addQuestion(testId: string, versionId: string, sectionId: string, input: { type: 'MCQ' | 'Short' | 'Speaking' | 'Writing' | 'Instruction' | 'Passage'; prompt: string; choices?: string[]; answer?: number | string | string[]; points: number; writingSettings?: any; isInstructionOnly?: boolean; passageContent?: string; passageId?: string }): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1) {
            const question: Question = {
              id: crypto.randomUUID(),
              type: input.type,
              prompt: input.prompt,
              choices: input.choices,
              answer: input.answer,
              points: input.points,
              createdAt: new Date().toISOString(),
              writingSettings: input.writingSettings,
              isInstructionOnly: input.isInstructionOnly,
              passageContent: input.passageContent,
              passageId: input.passageId,
            };
            return {
              ...test,
              versions: test.versions.map((v, vi) => 
                vi === versionIndex ? {
                  ...v,
                  sections: v.sections.map((s, si) => 
                    si === sectionIndex ? { ...s, questions: [...(s.questions || []), question] } : s
                  )
                } : v
              )
            };
          }
        }
      }
      return test;
    });
  },
  async updateQuestion(testId: string, versionId: string, sectionId: string, questionId: string, input: { type: 'MCQ' | 'Short' | 'Speaking' | 'Writing' | 'Instruction' | 'Passage'; prompt: string; choices?: string[]; answer?: number | string | string[]; points: number; writingSettings?: any; isInstructionOnly?: boolean; passageContent?: string; passageId?: string }): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1 && test.versions[versionIndex].sections[sectionIndex].questions) {
            const questionIndex = test.versions[versionIndex].sections[sectionIndex].questions!.findIndex(q => q.id === questionId);
            if (questionIndex !== -1) {
              return {
                ...test,
                versions: test.versions.map((v, vi) => 
                  vi === versionIndex ? {
                    ...v,
                    sections: v.sections.map((s, si) => 
                      si === sectionIndex ? {
                        ...s,
                        questions: s.questions?.map((q, qi) => 
                          qi === questionIndex ? {
                            ...q,
                            type: input.type,
                            prompt: input.prompt,
                            choices: input.choices,
                            answer: input.answer,
                            points: input.points,
                            writingSettings: input.writingSettings,
                            isInstructionOnly: input.isInstructionOnly,
                            passageContent: input.passageContent,
                            passageId: input.passageId,
                          } : q
                        )
                      } : s
                    )
                  } : v
                )
              };
            }
          }
        }
      }
      return test;
    });
  },
  async deleteQuestion(testId: string, versionId: string, sectionId: string, questionId: string): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1 && test.versions[versionIndex].sections[sectionIndex].questions) {
            const initialLength = test.versions[versionIndex].sections[sectionIndex].questions!.length;
            const newQuestions = test.versions[versionIndex].sections[sectionIndex].questions!.filter(q => q.id !== questionId);
            if (newQuestions.length < initialLength) {
              return {
                ...test,
                versions: test.versions.map((v, vi) => 
                  vi === versionIndex ? {
                    ...v,
                    sections: v.sections.map((s, si) => 
                      si === sectionIndex ? { ...s, questions: newQuestions } : s
                    )
                  } : v
                )
              };
            }
          }
        }
      }
      return test;
    });
  },
  async reorderQuestions(testId: string, versionId: string, sectionId: string, questionIds: string[]): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1 && test.versions[versionIndex].sections[sectionIndex].questions) {
            const section = test.versions[versionIndex].sections[sectionIndex];
            const reorderedQuestions = questionIds.map(id => 
              section.questions!.find(q => q.id === id)
            ).filter(Boolean) as Question[];
            
            if (reorderedQuestions.length === section.questions!.length) {
              return {
                ...test,
                versions: test.versions.map((v, vi) => 
                  vi === versionIndex ? {
                    ...v,
                    sections: v.sections.map((s, si) => 
                      si === sectionIndex ? { ...s, questions: reorderedQuestions } : s
                    )
                  } : v
                )
              };
            }
          }
        }
      }
      return test;
    });
  },
  
  async updateTestStatus(testId: string, status: 'Draft' | 'Published'): Promise<boolean> {
    return localStore.updateTest(testId, (test) => ({
      ...test,
      status,
    }));
  },

  // Assignment management methods
  async addAssignment(testId: string, input: { system: 'KR' | 'US' | 'UK'; grades: string[]; startAt: string; endAt: string }): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (!test.assignments) test.assignments = [];
      const assignment: TestAssignment = {
        id: crypto.randomUUID(),
        system: input.system,
        grades: input.grades,
        startAt: input.startAt,
        endAt: input.endAt,
        createdAt: new Date().toISOString(),
      };
      return {
        ...test,
        assignments: [...test.assignments, assignment],
      };
    });
  },

  async updateAssignment(testId: string, assignmentId: string, input: { system: 'KR' | 'US' | 'UK'; grades: string[]; startAt: string; endAt: string }): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.assignments) {
        const assignmentIndex = test.assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
          return {
            ...test,
            assignments: test.assignments.map((a, i) => 
              i === assignmentIndex ? {
                ...a,
                system: input.system,
                grades: input.grades,
                startAt: input.startAt,
                endAt: input.endAt,
              } : a
            )
          };
        }
      }
      return test;
    });
  },

  async deleteAssignment(testId: string, assignmentId: string): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.assignments) {
        const initialLength = test.assignments.length;
        const newAssignments = test.assignments.filter(a => a.id !== assignmentId);
        if (newAssignments.length < initialLength) {
          return {
            ...test,
            assignments: newAssignments,
          };
        }
      }
      return test;
    });
  },

  // Test attempts management
  async createAttempt(testId: string, versionId: string): Promise<TestAttempt> {
    const attempt: TestAttempt = {
      id: crypto.randomUUID(),
      testId,
      versionId,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
    };
    localStore.addAttempt(attempt);
    return attempt;
  },

  async updateCandidateInfo(attemptId: string, candidate: TestAttempt['candidate']): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      candidate,
    }));
  },

  async getAttempt(attemptId: string): Promise<TestAttempt | null> {
    return localStore.getAttempts().find(a => a.id === attemptId) || null;
  },

  async listAttempts(): Promise<TestAttempt[]> {
    return localStore.getAttempts().sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  async updateAttemptStatus(attemptId: string, status: TestAttempt['status']): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      status,
    }));
  },

  async saveAnswer(attemptId: string, questionId: string, response: string): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      answers: {
        ...attempt.answers,
        [questionId]: response
      }
    }));
  },

  async submitAttempt(attemptId: string, autoTotal: number, maxTotal: number): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      status: 'submitted',
      reviewStatus: 'pending',
      submittedAt: new Date().toISOString(),
      autoTotal,
      maxTotal,
      finalTotal: autoTotal,
    }));
  },

  async saveAudioAnswer(attemptId: string, questionId: string, audioUrl: string): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      audioAnswers: {
        ...attempt.audioAnswers,
        [questionId]: audioUrl
      }
    }));
  },

  async reviewAttempt(
    attemptId: string, 
    speakingReviews: SpeakingReview[], 
    rubrics?: Record<string, SpeakingRubric>, 
    humanTotal?: number
  ): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => {
      const calculatedHumanTotal = humanTotal ?? speakingReviews.reduce((sum, review) => sum + review.manualScore, 0);
      const autoTotal = attempt.autoTotal || 0;
      
      return {
        ...attempt,
        reviewStatus: 'completed',
        humanTotal: calculatedHumanTotal,
        finalTotal: autoTotal + calculatedHumanTotal,
        speakingReviews,
        rubric: rubrics,
      };
    });
  },

  async getSubmittedAttempts(): Promise<TestAttempt[]> {
    return localStore.getAttempts()
      .filter(a => a.status === 'submitted')
      .sort((a, b) => b.submittedAt?.localeCompare(a.submittedAt || '') || 0);
  },

  async getAllAttempts(): Promise<TestAttempt[]> {
    return localStore.getAttempts().sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  // Record tab switching violations
  async recordViolation(attemptId: string, type: 'blur' | 'visibility' | 'lockdown_violation'): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      violations: [
        ...(attempt.violations || []),
        {
          at: new Date().toISOString(),
          type
        }
      ]
    }));
  },

  // Save resume progress
  async saveResumeProgress(attemptId: string, sectionIndex: number, questionIndex: number, remainingSeconds: number): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      resume: {
        sectionIndex,
        questionIndex,
        remainingSeconds,
        savedAt: new Date().toISOString()
      }
    }));
  },

  // Save preflight results to memoryRepo
  async savePreflightResults(attemptId: string, preflight: { mic: boolean; record: boolean; play: boolean; net: { downKbps: number; upKbps: number }; checkedAt: string }): Promise<boolean> {
    return localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      preflight
    }));
  },

  // Get available assignments for students
  async getAvailableAssignments(system: 'KR' | 'US' | 'UK', grade: string): Promise<Array<{ test: Test; assignment: TestAssignment; version?: TestVersion }>> {
    const now = new Date();
    const results: Array<{ test: Test; assignment: TestAssignment; version?: TestVersion }> = [];
    const tests = localStore.getTests();

    for (const test of tests) {
      if (test.status !== 'Published' || !test.assignments) continue;

      for (const assignment of test.assignments) {
        if (assignment.system !== system || !assignment.grades.includes(grade)) continue;

        const startDate = new Date(assignment.startAt);
        const endDate = new Date(assignment.endAt);
        
        if (now >= startDate && now <= endDate) {
          // Find matching version
          const version = test.versions?.find(v => v.system === assignment.system);
          results.push({ test, assignment, version });
        }
      }
    }

    return results.sort((a, b) => a.test.name.localeCompare(b.test.name));
  },

  // Clone test with deep copy
  async cloneTest(testId: string): Promise<Test | null> {
    const originalTest = localStore.getTests().find(t => t.id === testId);
    if (!originalTest) return null;

    // Deep clone function for versions
    const cloneVersions = (versions: TestVersion[]): TestVersion[] => {
      return versions.map(version => ({
        ...version,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        sections: version.sections?.map(section => ({
          ...section,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          questions: section.questions?.map(question => ({
            ...question,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
          }))
        }))
      }));
    };

    const clonedTest: Test = {
      ...originalTest,
      id: crypto.randomUUID(),
      name: `${originalTest.name} (복사본)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      versions: originalTest.versions ? cloneVersions(originalTest.versions) : [],
      // Exclude assignments and attempts
      assignments: undefined
    };

    localStore.addTest(clonedTest);
    return clonedTest;
  },

  // 응시 옵션 관리
  async updateExamOptions(testId: string, versionId: string, options: TestVersion['examOptions']): Promise<boolean> {
    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1) {
          return {
            ...test,
            versions: test.versions.map((v, i) => 
              i === versionIndex ? { ...v, examOptions: options } : v
            )
          };
        }
      }
      return test;
    });
  },

  // 시험 시도 시 레이아웃 생성
  async createAttemptWithLayout(testId: string, versionId: string, userId: string = 'anonymous'): Promise<TestAttempt> {
    const { generateTestLayout } = await import('@/utils/testLayoutGenerator');
    
    const tests = localStore.getTests();
    const test = tests.find(t => t.id === testId);
    const version = test?.versions?.find(v => v.id === versionId);
    
    if (!test || !version) {
      throw new Error('Test or version not found');
    }

    const attemptId = crypto.randomUUID();
    const layout = generateTestLayout(version, attemptId, userId);
    
    const attempt: TestAttempt = {
      id: attemptId,
      testId,
      versionId,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      answers: {},
      audioAnswers: {},
      violations: [],
      layout
    };

    localStore.addAttempt(attempt);
    return attempt;
  },

  // Question Bank Management
  async getQuestionBank(): Promise<QuestionBankItem[]> {
    return localStore.getQuestionBank();
  },

  async addQuestionToBank(question: Omit<QuestionBankItem, 'id' | 'createdAt'>): Promise<QuestionBankItem> {
    const item: QuestionBankItem = {
      ...question,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    localStore.addQuestionToBank(item);
    return item;
  },

  async updateQuestionInBank(id: string, updates: Partial<Omit<QuestionBankItem, 'id' | 'createdAt'>>): Promise<boolean> {
    return localStore.updateQuestionInBank(id, updates);
  },

  async deleteQuestionFromBank(id: string): Promise<boolean> {
    return localStore.deleteQuestionFromBank(id);
  },

  async addQuestionsToSection(testId: string, versionId: string, sectionId: string, questionIds: string[]): Promise<boolean> {
    const questionBank = localStore.getQuestionBank();
    const questionsToAdd = questionBank
      .filter(q => questionIds.includes(q.id))
      .map(q => ({
        id: crypto.randomUUID(), // New ID for the copy
        type: q.type,
        prompt: q.prompt,
        choices: q.choices,
        answer: q.answer,
        points: q.points,
        createdAt: new Date().toISOString()
      } as Question));

    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1) {
            const currentQuestions = test.versions[versionIndex].sections[sectionIndex].questions || [];
            return {
              ...test,
              versions: test.versions.map((v, vi) => 
                vi === versionIndex ? {
                  ...v,
                  sections: v.sections.map((s, si) => 
                    si === sectionIndex ? {
                      ...s,
                      questions: [...currentQuestions, ...questionsToAdd]
                    } : s
                  )
                } : v
              )
            };
          }
        }
      }
      return test;
    });
  },

  async exportQuestionBank(): Promise<string> {
    const questionBank = localStore.getQuestionBank();
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      questions: questionBank
    };
    return JSON.stringify(exportData, null, 2);
  },

  async importQuestionBank(jsonData: string): Promise<{ success: boolean; message: string; imported: number }> {
    try {
      const parsedData = JSON.parse(jsonData);
      
      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        return { success: false, message: '올바르지 않은 데이터 형식입니다.', imported: 0 };
      }

      let imported = 0;
      for (const question of parsedData.questions) {
        // Validate question structure
        if (question.type && question.prompt && typeof question.points === 'number') {
          const item: QuestionBankItem = {
            ...question,
            id: crypto.randomUUID(), // Generate new ID to avoid conflicts
            createdAt: new Date().toISOString(),
            tags: question.tags || [],
            difficulty: question.difficulty || 'Medium',
          };
          localStore.addQuestionToBank(item);
          imported++;
        }
      }

      return { 
        success: true, 
        message: `${imported}개의 문항이 성공적으로 가져와졌습니다.`, 
        imported 
      };
    } catch (error) {
      console.error('Question bank import failed:', error);
      return { 
        success: false, 
        message: '데이터 가져오기에 실패했습니다. 파일 형식을 확인해주세요.', 
        imported: 0 
      };
    }
  },

  // Get recently used questions (last 90 days)
  async getRecentlyUsedQuestionPrompts(): Promise<string[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const attempts = localStore.getAttempts();
    const tests = localStore.getTests();
    const usedPrompts = new Set<string>();

    for (const attempt of attempts) {
      // Only check attempts from the last 90 days
      if (new Date(attempt.startedAt) < ninetyDaysAgo) continue;
      
      const test = tests.find(t => t.id === attempt.testId);
      const version = test?.versions?.find(v => v.id === attempt.versionId);
      
      if (version?.sections) {
        for (const section of version.sections) {
          if (section.questions) {
            for (const question of section.questions) {
              if (question.type === 'Speaking') {
                usedPrompts.add(question.prompt);
              }
            }
          }
        }
      }
    }

    return Array.from(usedPrompts);
  },

  // Add multiple speaking questions to a section
  async addGeneratedSpeakingQuestions(
    testId: string, 
    versionId: string, 
    sectionId: string, 
    questions: Omit<QuestionBankItem, 'id' | 'createdAt'>[]
  ): Promise<boolean> {
    const questionsToAdd = questions.map(q => ({
      id: crypto.randomUUID(),
      type: q.type,
      prompt: q.prompt,
      choices: q.choices,
      answer: q.answer,
      points: q.points,
      createdAt: new Date().toISOString()
    }));

    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1) {
            const currentQuestions = test.versions[versionIndex].sections[sectionIndex].questions || [];
            return {
              ...test,
              versions: test.versions.map((v, vi) => 
                vi === versionIndex ? {
                  ...v,
                  sections: v.sections.map((s, si) => 
                    si === sectionIndex ? {
                      ...s,
                      questions: [...currentQuestions, ...questionsToAdd]
                    } : s
                  )
                } : v
              )
            };
          }
        }
      }
      return test;
    });
  },

  // Short Answer grading and re-grading functionality
  async addAnswerToQuestionKey(
    testId: string, 
    versionId: string, 
    sectionId: string, 
    questionId: string, 
    newAnswer: string
  ): Promise<boolean> {
    const { shortAnswerGradingUtils } = await import('@/utils/shortAnswerGrading');
    const { useScoringProfiles } = await import('@/hooks/useScoringProfiles');

    return localStore.updateTest(testId, (test) => {
      if (test.versions) {
        const versionIndex = test.versions.findIndex(v => v.id === versionId);
        if (versionIndex !== -1 && test.versions[versionIndex].sections) {
          const sectionIndex = test.versions[versionIndex].sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1 && test.versions[versionIndex].sections[sectionIndex].questions) {
            const questionIndex = test.versions[versionIndex].sections[sectionIndex].questions!.findIndex(q => q.id === questionId);
            if (questionIndex !== -1) {
              const question = test.versions[versionIndex].sections[sectionIndex].questions![questionIndex];
              
              if (question.type === 'Short') {
                // Get default scoring profile (this is a simplified approach)
                const defaultShortConfig = {
                  ignoreWhitespace: true,
                  ignoreCase: false,
                  typoTolerance: 0,
                  regexPatterns: []
                };
                
                const currentAnswers = question.answer 
                  ? Array.isArray(question.answer) 
                    ? question.answer 
                    : [String(question.answer)]
                  : [];
                
                const updatedAnswers = shortAnswerGradingUtils.addToAnswerKey(
                  currentAnswers, 
                  newAnswer, 
                  defaultShortConfig
                );
                
                return {
                  ...test,
                  versions: test.versions.map((v, vi) => 
                    vi === versionIndex ? {
                      ...v,
                      sections: v.sections.map((s, si) => 
                        si === sectionIndex ? {
                          ...s,
                          questions: s.questions?.map((q, qi) => 
                            qi === questionIndex ? {
                              ...q,
                              answer: updatedAnswers.length === 1 ? updatedAnswers[0] : updatedAnswers
                            } : q
                          )
                        } : s
                      )
                    } : v
                  )
                };
              }
            }
          }
        }
      }
      return test;
    });
  },

  // Re-grade all attempts for a specific test/version after answer key update
  async regradeShortAnswers(testId: string, versionId: string): Promise<{ updated: number; attempts: TestAttempt[] }> {
    const { shortAnswerGradingUtils } = await import('@/utils/shortAnswerGrading');
    
    const tests = localStore.getTests();
    const test = tests.find(t => t.id === testId);
    const version = test?.versions?.find(v => v.id === versionId);
    
    if (!test || !version) {
      throw new Error('Test or version not found');
    }

    // Get default scoring profile (simplified)
    const defaultShortConfig = {
      ignoreWhitespace: true,
      ignoreCase: false,
      typoTolerance: 0,
      regexPatterns: []
    };

    // Get all attempts for this test/version
    const attempts = localStore.getAttempts().filter(
      a => a.testId === testId && a.versionId === versionId && a.status === 'submitted'
    );

    let updatedCount = 0;
    const updatedAttempts: TestAttempt[] = [];

    for (const attempt of attempts) {
      let newAutoTotal = 0;
      let hasChanges = false;

      // Re-grade Short questions
      if (version.sections) {
        for (const section of version.sections) {
          if (section.questions) {
            for (const question of section.questions) {
              const userAnswer = attempt.answers?.[question.id];
              
              if (question.type === 'Short' && userAnswer && question.answer) {
                const correctAnswers = Array.isArray(question.answer) 
                  ? question.answer 
                  : [String(question.answer)];
                
                const isCorrect = shortAnswerGradingUtils.checkAnswer(
                  userAnswer,
                  correctAnswers,
                  defaultShortConfig
                );
                
                if (isCorrect) {
                  newAutoTotal += question.points;
                }
              } else if (question.type === 'MCQ' && userAnswer && typeof question.answer === 'number') {
                // Keep MCQ scores the same
                const userAnswerIndex = parseInt(userAnswer);
                if (userAnswerIndex === question.answer) {
                  newAutoTotal += question.points;
                }
              }
            }
          }
        }
      }

      // Update attempt if score changed
      if (newAutoTotal !== (attempt.autoTotal || 0)) {
        hasChanges = true;
        const humanTotal = attempt.humanTotal || 0;
        const finalTotal = newAutoTotal + humanTotal;

        localStore.updateAttempt(attempt.id, (a) => ({
          ...a,
          autoTotal: newAutoTotal,
          finalTotal: finalTotal
        }));

        updatedCount++;
        updatedAttempts.push({
          ...attempt,
          autoTotal: newAutoTotal,
          finalTotal: finalTotal
        });
      } else {
        updatedAttempts.push(attempt);
      }
    }

    return { updated: updatedCount, attempts: updatedAttempts };
  },

  // Get Short answer statistics for a specific question
  async getShortAnswerStats(testId: string, versionId: string, questionId: string): Promise<{
    totalResponses: number;
    correctResponses: number;
    uniqueAnswers: Array<{ answer: string; count: number; isCorrect: boolean }>;
  }> {
    const { shortAnswerGradingUtils } = await import('@/utils/shortAnswerGrading');
    
    const tests = localStore.getTests();
    const test = tests.find(t => t.id === testId);
    const version = test?.versions?.find(v => v.id === versionId);
    
    if (!test || !version) {
      throw new Error('Test or version not found');
    }

    // Find the question
    let targetQuestion: Question | null = null;
    for (const section of version.sections || []) {
      const question = section.questions?.find(q => q.id === questionId);
      if (question) {
        targetQuestion = question;
        break;
      }
    }

    if (!targetQuestion || targetQuestion.type !== 'Short') {
      throw new Error('Short answer question not found');
    }

    // Get default scoring profile (simplified)
    const defaultShortConfig = {
      ignoreWhitespace: true,
      ignoreCase: false,
      typoTolerance: 0,
      regexPatterns: []
    };

    // Collect all responses for this question
    const attempts = localStore.getAttempts().filter(
      a => a.testId === testId && a.versionId === versionId && a.status === 'submitted'
    );

    const answerCounts = new Map<string, number>();
    let totalResponses = 0;
    let correctResponses = 0;

    for (const attempt of attempts) {
      const userAnswer = attempt.answers?.[questionId];
      if (userAnswer && userAnswer.trim()) {
        totalResponses++;
        
        const trimmedAnswer = userAnswer.trim();
        answerCounts.set(trimmedAnswer, (answerCounts.get(trimmedAnswer) || 0) + 1);
        
        // Check if correct
        const correctAnswers = Array.isArray(targetQuestion.answer) 
          ? targetQuestion.answer 
          : targetQuestion.answer ? [String(targetQuestion.answer)] : [];
          
        const isCorrect = shortAnswerGradingUtils.checkAnswer(
          userAnswer,
          correctAnswers,
          defaultShortConfig
        );
        
        if (isCorrect) {
          correctResponses++;
        }
      }
    }

    const uniqueAnswers = Array.from(answerCounts.entries()).map(([answer, count]) => {
      const correctAnswers = Array.isArray(targetQuestion!.answer) 
        ? targetQuestion!.answer 
        : targetQuestion!.answer ? [String(targetQuestion!.answer)] : [];
        
      return {
        answer,
        count,
        isCorrect: shortAnswerGradingUtils.checkAnswer(
          answer,
          correctAnswers,
          defaultShortConfig
        )
      };
    }).sort((a, b) => b.count - a.count); // Sort by frequency

    return {
      totalResponses,
      correctResponses,
      uniqueAnswers
    };
  },

  // Update attempt with partial data (different signature from localStore.updateAttempt)
  async updateAttemptData(attemptId: string, updates: Partial<TestAttempt>): Promise<TestAttempt> {
    const success = localStore.updateAttempt(attemptId, (attempt) => ({
      ...attempt,
      ...updates
    }));
    
    if (!success) {
      throw new Error('Attempt not found or update failed');
    }
    
    const updatedAttempt = localStore.getAttempts().find(a => a.id === attemptId);
    if (!updatedAttempt) {
      throw new Error('Updated attempt not found');
    }
    
    return updatedAttempt;
  }
};