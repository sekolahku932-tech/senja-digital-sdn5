
export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER', // Wali Kelas
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for student view
  name: string;
  role: Role;
  classAssigned?: string; // For teachers (e.g., "1", "6")
}

export interface Student {
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classGrade: string; // 1-6
  parentId?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text';
}

export interface Material {
  id: string;
  title: string;
  classGrade: string; // 1-6
  type: 'PDF' | 'VIDEO' | 'ARTICLE';
  contentUrl: string; // Link or base64 placeholder
  coverImage?: string;
  description?: string;
  taskInstruction?: string; // New: Specific instruction for the upload task
  reflectionQuestions: Question[];
}

export interface Submission {
  id: string;
  studentNisn: string;
  studentName: string;
  materialId: string;
  materialTitle: string;
  answers: Record<string, string>; // questionId -> answer
  taskFile?: string; // URL/Base64
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  teacherFeedback?: string;
  submittedAt: string;
}

export interface Parent {
  id: string;
  studentNisn: string;
  name: string;
  phone: string;
}

export interface AppState {
  currentUser: User | null;
}
