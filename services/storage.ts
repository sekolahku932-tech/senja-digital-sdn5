import { User, Student, Material, Submission, AppSettings } from '../types';
import { INITIAL_ADMIN, DEFAULT_CERT_BG } from '../constants';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  setDoc,
  getDocs,
  where
} from 'firebase/firestore';

const KEYS = {
  USERS: 'users',
  STUDENTS: 'students',
  MATERIALS: 'materials',
  SUBMISSIONS: 'submissions',
  SETTINGS: 'settings',
  SESSION: 'senja_session_local' // Session remains local
};

// --- Helper for Snapshots ---
// We use callbacks to update React state in real-time
export const subscribeCollection = (collectionName: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, collectionName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
};

// --- Users ---
// For users, we might want to check initial admin existence
export const initAdminUser = async () => {
  const usersRef = collection(db, KEYS.USERS);
  const q = query(usersRef, where("username", "==", "admin"));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create default admin if not exists
    await addDoc(usersRef, { ...INITIAL_ADMIN, id: undefined }); // Let firestore gen ID
  }
}

export const subscribeUsers = (cb: (users: User[]) => void) => subscribeCollection(KEYS.USERS, cb);

export const saveUser = async (user: User) => {
  if (user.id && user.id.length > 20) { // Firestore IDs are usually long
     await updateDoc(doc(db, KEYS.USERS, user.id), { ...user });
  } else {
     const { id, ...data } = user; // Remove fake ID if any
     await addDoc(collection(db, KEYS.USERS), data);
  }
};

export const deleteUser = async (id: string) => {
  await deleteDoc(doc(db, KEYS.USERS, id));
};

// --- Students ---
export const subscribeStudents = (cb: (students: Student[]) => void) => subscribeCollection(KEYS.STUDENTS, cb);

export const saveStudent = async (student: Student) => {
  if (student.id && student.id.length > 20) {
    await updateDoc(doc(db, KEYS.STUDENTS, student.id), { ...student });
  } else {
    const { id, ...data } = student;
    await addDoc(collection(db, KEYS.STUDENTS), data);
  }
};

export const deleteStudent = async (id: string) => {
  await deleteDoc(doc(db, KEYS.STUDENTS, id));
};

export const bulkImportStudents = async (students: Student[]) => {
  const batchPromises = students.map(s => {
      const { id, ...data } = s;
      return addDoc(collection(db, KEYS.STUDENTS), data);
  });
  await Promise.all(batchPromises);
};

// --- Materials ---
export const subscribeMaterials = (cb: (materials: Material[]) => void) => subscribeCollection(KEYS.MATERIALS, cb);

export const saveMaterial = async (material: Material) => {
  if (material.id && material.id.length > 20) {
    await updateDoc(doc(db, KEYS.MATERIALS, material.id), { ...material });
  } else {
    const { id, ...data } = material;
    await addDoc(collection(db, KEYS.MATERIALS), data);
  }
};

export const deleteMaterial = async (id: string) => {
  await deleteDoc(doc(db, KEYS.MATERIALS, id));
};

// --- Submissions ---
export const subscribeSubmissions = (cb: (subs: Submission[]) => void) => subscribeCollection(KEYS.SUBMISSIONS, cb);

export const saveSubmission = async (sub: Submission) => {
  if (sub.id && sub.id.length > 20) {
    await updateDoc(doc(db, KEYS.SUBMISSIONS, sub.id), { ...sub });
  } else {
    const { id, ...data } = sub;
    await addDoc(collection(db, KEYS.SUBMISSIONS), data);
  }
};

// --- Settings ---
// Settings is a single document
export const subscribeSettings = (cb: (s: AppSettings) => void) => {
    return onSnapshot(doc(db, KEYS.SETTINGS, 'global'), (doc) => {
        if (doc.exists()) {
            cb(doc.data() as AppSettings);
        } else {
            cb({ certBackground: DEFAULT_CERT_BG });
        }
    });
};

export const saveSettings = async (settings: AppSettings) => {
  await setDoc(doc(db, KEYS.SETTINGS, 'global'), settings);
};

// --- Session (Still Local) ---
export const getSession = (): User | Student | null => {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
}

export const setSession = (user: User | Student) => {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
}

export const clearSession = () => {
    localStorage.removeItem(KEYS.SESSION);
}