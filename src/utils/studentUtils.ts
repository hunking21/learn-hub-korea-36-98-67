// Student management utilities for CSV upload and data management

export interface Student {
  id: string;
  name: string;
  educationSystem: string; // 학제 (예: 초등, 중등, 고등)
  grade: string; // 학년
  contact: string; // 연락처
  class: string; // 반
  createdAt: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  students: Student[];
  educationSystem?: string;
  grade?: string;
  class?: string;
}

const STUDENTS_STORAGE_KEY = 'tn_academy_students';
const GROUPS_STORAGE_KEY = 'tn_academy_student_groups';

class StudentManager {
  private students: Map<string, Student> = new Map();
  private groups: Map<string, StudentGroup> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      // Load students
      const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudents) {
        const studentArray: Student[] = JSON.parse(storedStudents);
        studentArray.forEach(student => {
          this.students.set(student.id, student);
        });
      }

      // Load groups
      const storedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (storedGroups) {
        const groupArray: StudentGroup[] = JSON.parse(storedGroups);
        groupArray.forEach(group => {
          this.groups.set(group.id, group);
        });
      }
    } catch (error) {
      console.error('Failed to load student data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const studentArray = Array.from(this.students.values());
      const groupArray = Array.from(this.groups.values());
      
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(studentArray));
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groupArray));
    } catch (error) {
      console.error('Failed to save student data to storage:', error);
    }
  }

  generateId(): string {
    return `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addStudent(studentData: Omit<Student, 'id' | 'createdAt'>): Student {
    const student: Student = {
      ...studentData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    this.students.set(student.id, student);
    this.saveToStorage();
    return student;
  }

  addStudentsFromCSV(csvData: string): { success: Student[]; errors: string[] } {
    const lines = csvData.trim().split('\n');
    const success: Student[] = [];
    const errors: string[] = [];

    // Skip header line if exists
    const dataLines = lines[0].includes('이름') || lines[0].includes('name') ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
      try {
        const [name, educationSystem, grade, contact, classValue] = line.split(',').map(s => s.trim());
        
        if (!name || !educationSystem || !grade) {
          errors.push(`라인 ${index + 2}: 필수 필드 누락 (이름, 학제, 학년)`);
          return;
        }

        const student = this.addStudent({
          name,
          educationSystem,
          grade,
          contact: contact || '',
          class: classValue || ''
        });

        success.push(student);
      } catch (error) {
        errors.push(`라인 ${index + 2}: 데이터 형식 오류`);
      }
    });

    return { success, errors };
  }

  getStudents(): Student[] {
    return Array.from(this.students.values());
  }

  searchStudents(query: string): Student[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getStudents().filter(student =>
      student.name.toLowerCase().includes(lowercaseQuery) ||
      student.educationSystem.toLowerCase().includes(lowercaseQuery) ||
      student.grade.toLowerCase().includes(lowercaseQuery) ||
      student.class.toLowerCase().includes(lowercaseQuery) ||
      student.contact.toLowerCase().includes(lowercaseQuery)
    );
  }

  getStudentsByEducationSystem(educationSystem: string): Student[] {
    return this.getStudents().filter(student => student.educationSystem === educationSystem);
  }

  getStudentsByGrade(educationSystem: string, grade: string): Student[] {
    return this.getStudents().filter(student => 
      student.educationSystem === educationSystem && student.grade === grade
    );
  }

  getStudentsByClass(educationSystem: string, grade: string, classValue: string): Student[] {
    return this.getStudents().filter(student => 
      student.educationSystem === educationSystem && 
      student.grade === grade && 
      student.class === classValue
    );
  }

  createGroup(name: string, studentIds: string[]): StudentGroup {
    const students = studentIds
      .map(id => this.students.get(id))
      .filter((student): student is Student => student !== undefined);

    const group: StudentGroup = {
      id: this.generateId(),
      name,
      students
    };

    this.groups.set(group.id, group);
    this.saveToStorage();
    return group;
  }

  getGroups(): StudentGroup[] {
    return Array.from(this.groups.values());
  }

  deleteStudent(studentId: string): boolean {
    const deleted = this.students.delete(studentId);
    if (deleted) {
      // Remove from all groups
      this.groups.forEach(group => {
        group.students = group.students.filter(s => s.id !== studentId);
      });
      this.saveToStorage();
    }
    return deleted;
  }

  deleteGroup(groupId: string): boolean {
    const deleted = this.groups.delete(groupId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getUniqueEducationSystems(): string[] {
    const systems = new Set(this.getStudents().map(s => s.educationSystem));
    return Array.from(systems).sort();
  }

  getUniqueGrades(educationSystem?: string): string[] {
    let students = this.getStudents();
    if (educationSystem) {
      students = students.filter(s => s.educationSystem === educationSystem);
    }
    const grades = new Set(students.map(s => s.grade));
    return Array.from(grades).sort();
  }

  getUniqueClasses(educationSystem?: string, grade?: string): string[] {
    let students = this.getStudents();
    if (educationSystem) {
      students = students.filter(s => s.educationSystem === educationSystem);
    }
    if (grade) {
      students = students.filter(s => s.grade === grade);
    }
    const classes = new Set(students.map(s => s.class).filter(c => c));
    return Array.from(classes).sort();
  }
}

export const studentManager = new StudentManager();