
import { User, Role, Student, Material, Submission } from '../types';

// Initial Data
const INITIAL_USERS: User[] = [
  // Added classAssigned: '' to ensure the column is created in Spreadsheet even for Admin
  { id: 'u1', username: 'admin', password: 'admin', name: 'Administrator', role: Role.ADMIN, classAssigned: '' },
  { id: 'u2', username: 'guru1', password: '123', name: 'Ibu Ratna', role: Role.TEACHER, classAssigned: '1' },
];

const INITIAL_STUDENTS: Student[] = [
  { nisn: '12345', name: 'Budi Santoso', gender: 'L', classGrade: '1' },
  { nisn: '67890', name: 'Siti Aminah', gender: 'P', classGrade: '1' },
];

const INITIAL_MATERIALS: Material[] = [
  {
    id: 'm1',
    title: 'Kancil dan Buaya',
    classGrade: '1',
    type: 'ARTICLE',
    contentUrl: 'https://example.com',
    coverImage: 'https://picsum.photos/400/300',
    description: 'Cerita fabel tentang kecerdikan kancil.',
    taskInstruction: 'Gambarlah tokoh Kancil di buku gambarmu, lalu foto dan upload di sini.',
    reflectionQuestions: [
      { id: 'q1', text: 'Siapa tokoh utama dalam cerita?', type: 'text' },
      { id: 'q2', text: 'Apa pesan moral dari cerita tersebut?', type: 'text' }
    ]
  }
];

const KEYS = {
  USERS: 'senja_users',
  STUDENTS: 'senja_students',
  MATERIALS: 'senja_materials',
  SUBMISSIONS: 'senja_submissions',
  SETTINGS: 'senja_settings',
  DB_URL: 'senja_db_url'
};

// --- DEFAULT SYSTEM CONFIGURATION ---
const SYSTEM_DB_URL = "https://script.google.com/macros/s/AKfycbwBck0oTRjTrPnh4eWsmH-JkyGxvMOA69tg8HNPl0iw97VcPTxR2U12NzripdZBbrK-/exec";

// Helper to get/set
const get = <T>(key: string, initial: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initial;
  }
};

const set = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- SYNC ENGINE ---
const getDbUrl = () => localStorage.getItem(KEYS.DB_URL) || SYSTEM_DB_URL;

const syncToCloud = async () => {
  const url = getDbUrl();
  if (!url) return;

  const payload = {
    action: 'SAVE',
    data: {
      users: get(KEYS.USERS, INITIAL_USERS),
      students: get(KEYS.STUDENTS, INITIAL_STUDENTS),
      materials: get(KEYS.MATERIALS, INITIAL_MATERIALS),
      submissions: get(KEYS.SUBMISSIONS, [])
    },
    settings: {
        certBg: get(KEYS.SETTINGS, '')
    }
  };

  // Size Check (approx 2MB limit for safety with gas)
  const payloadStr = JSON.stringify(payload);
  if (payloadStr.length > 2500000) {
      console.warn("Payload too large for Google Script, reducing image quality/data not implemented but recommended.");
  }

  try {
    await fetch(url, {
      method: 'POST',
      body: payloadStr
    });
    console.log("Data synced to Spreadsheet");
  } catch (e) {
    console.error("Sync failed", e);
  }
};

const syncFromCloud = async () => {
  const url = getDbUrl();
  if (!url) return false;

  try {
    const res = await fetch(`${url}?action=GET`);
    const json = await res.json();
    
    // --- DATA SANITIZATION & MIGRATION ---
    // Pastikan data memiliki field yang wajib, meskipun di spreadsheet kolomnya belum ada

    // 1. Validate Users
    let users = json.users || [];
    if (!Array.isArray(users)) users = [];
    
    users = users.map((u: any) => ({
        ...u,
        // Jika Guru tidak punya kelas (undefined), set default ke '1'
        // Jika Admin tidak punya kelas, set string kosong '' (agar kolom terbentuk)
        classAssigned: u.classAssigned !== undefined && u.classAssigned !== null 
            ? String(u.classAssigned) 
            : (u.role === Role.TEACHER ? '1' : '')
    }));

    // Check if admin exists in cloud data
    const hasAdmin = users.some((u: any) => u.username === 'admin');
    if (!hasAdmin) {
       console.warn("Admin missing in cloud data. Injecting default admin.");
       users.push(INITIAL_USERS[0]);
    }

    // 2. Validate Students
    let students = json.students || [];
    if (Array.isArray(students)) {
        students = students.map((s: any) => ({
            ...s,
            // Pastikan kelas ada
            classGrade: s.classGrade ? String(s.classGrade) : '1'
        }));
    } else {
        students = [];
    }

    // 3. Validate Materials
    let materials = json.materials || [];
    if (Array.isArray(materials)) {
        materials = materials.map((m: any) => ({
            ...m,
            classGrade: m.classGrade ? String(m.classGrade) : '1'
        }));
    }

    set(KEYS.USERS, users);
    set(KEYS.STUDENTS, students);
    if (materials.length > 0) set(KEYS.MATERIALS, materials);
    if (json.submissions) set(KEYS.SUBMISSIONS, json.submissions);
    if (json.settings?.certBg) set(KEYS.SETTINGS, json.settings.certBg);
    
    console.log("Data loaded and sanitized from Spreadsheet");
    return true;
  } catch (e) {
    console.error("Load failed", e);
    return false;
  }
};

export const storageService = {
  // Sync Methods
  getDbUrl,
  setDbUrl: (url: string) => {
    localStorage.setItem(KEYS.DB_URL, url);
    if (url) syncFromCloud();
  },
  syncToCloud,
  syncFromCloud,
  
  // Hard Reset
  resetApp: () => {
    localStorage.clear();
    window.location.reload();
  },

  // Users
  getUsers: () => {
    let users = get<User[]>(KEYS.USERS, INITIAL_USERS);
    // ROBUST FAILSAFE: Ensure Admin always exists locally
    if (!Array.isArray(users) || users.length === 0 || !users.find(u => u.username === 'admin')) {
      // Re-inject defaults
      users = [...INITIAL_USERS];
      set(KEYS.USERS, users);
    }
    return users;
  },
  saveUser: (user: User) => {
    let users = get<User[]>(KEYS.USERS, INITIAL_USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    set(KEYS.USERS, users);
    syncToCloud();
  },
  deleteUser: (id: string) => {
    const users = get<User[]>(KEYS.USERS, INITIAL_USERS);
    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.username === 'admin') return; 
    
    set(KEYS.USERS, users.filter(u => u.id !== id));
    syncToCloud();
  },

  // Students
  getStudents: () => get<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS),
  saveStudent: (student: Student) => {
    const list = get<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
    const index = list.findIndex(s => s.nisn === student.nisn);
    if (index >= 0) list[index] = student;
    else list.push(student);
    set(KEYS.STUDENTS, list);
    syncToCloud();
  },
  deleteStudent: (nisn: string) => {
    const list = get<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
    set(KEYS.STUDENTS, list.filter(s => s.nisn !== nisn));
    syncToCloud();
  },
  importStudents: (students: Student[]) => {
    const current = get<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
    const map = new Map(current.map(s => [s.nisn, s]));
    students.forEach(s => map.set(s.nisn, s));
    set(KEYS.STUDENTS, Array.from(map.values()));
    syncToCloud();
  },

  // Materials
  getMaterials: () => get<Material[]>(KEYS.MATERIALS, INITIAL_MATERIALS),
  saveMaterial: (item: Material) => {
    const list = get<Material[]>(KEYS.MATERIALS, INITIAL_MATERIALS);
    const index = list.findIndex(m => m.id === item.id);
    if (index >= 0) list[index] = item;
    else list.push(item);
    set(KEYS.MATERIALS, list);
    syncToCloud();
  },
  deleteMaterial: (id: string) => {
    const list = get<Material[]>(KEYS.MATERIALS, INITIAL_MATERIALS);
    set(KEYS.MATERIALS, list.filter(m => m.id !== id));
    syncToCloud();
  },

  // Submissions
  getSubmissions: () => get<Submission[]>(KEYS.SUBMISSIONS, []),
  saveSubmission: (sub: Submission) => {
    const list = get<Submission[]>(KEYS.SUBMISSIONS, []);
    const index = list.findIndex(s => s.id === sub.id);
    if (index >= 0) list[index] = sub;
    else list.push(sub);
    set(KEYS.SUBMISSIONS, list);
    syncToCloud();
  },

  // Settings
  getCertBg: () => get<string>(KEYS.SETTINGS, ''),
  setCertBg: (url: string) => {
    set(KEYS.SETTINGS, url);
    syncToCloud();
  },
};
