
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Role, User } from '../types';
import { storageService } from '../services/storageService';
import { ArrowLeft, User as UserIcon, Lock, KeyRound, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const targetRole = role?.toUpperCase();

  const showNotify = (msg: string, type: 'success'|'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await storageService.syncFromCloud();
    setIsSyncing(false);
    if (success) {
      showNotify('Data berhasil diperbarui dari Spreadsheet!', 'success');
      // Force reload users to check login again immediately after a short delay
      setTimeout(() => window.location.reload(), 1500);
    } else {
      if(!storageService.getDbUrl()) {
        showNotify('URL Database belum diatur. Minta Admin mengatur di menu Settings.', 'error');
      } else {
        showNotify('Gagal mengambil data. Periksa koneksi internet.', 'error');
      }
    }
  };

  const executeReset = () => {
    storageService.resetApp();
    setShowResetConfirm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (targetRole === 'STUDENT') {
      const students = storageService.getStudents();
      const student = students.find(s => s.nisn === username);
      if (student) {
        onLogin({
          id: student.nisn,
          username: student.nisn,
          name: student.name,
          role: Role.STUDENT,
          classAssigned: student.classGrade
        });
        navigate('/student/read');
      } else {
        setError('NISN tidak ditemukan.');
      }
    } else {
      const users = storageService.getUsers();
      // Fail-safe: if users is somehow not an array
      if (!Array.isArray(users)) {
         setError('Data user rusak. Silakan Reset Aplikasi di bawah.');
         return;
      }
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        if (targetRole === 'ADMIN' && user.role !== Role.ADMIN) {
          setError('Akun ini bukan admin.');
          return;
        }
        if (targetRole === 'TEACHER' && user.role !== Role.TEACHER) {
          setError('Akun ini bukan guru.');
          return;
        }
        onLogin(user);
        navigate('/dashboard');
      } else {
        setError('Username atau password salah.');
      }
    }
  };

  const getTitle = () => {
    switch (targetRole) {
      case 'ADMIN': return 'Login Admin';
      case 'TEACHER': return 'Login Wali Kelas';
      case 'STUDENT': return 'Login Siswa';
      default: return 'Login';
    }
  };

  return (
    <div className="min-h-screen bg-bgLight flex items-center justify-center p-4 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-xl text-white font-medium flex items-center gap-2 animate-bounce ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
           {notification.type === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
           {notification.msg}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative">
        <button onClick={() => navigate('/')} className="mb-6 text-slate-500 hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Kembali ke Beranda
        </button>

        <div className="flex justify-between items-start mb-1">
          <h2 className="text-2xl font-display font-bold text-slate-800">{getTitle()}</h2>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-primary transition-all ${isSyncing ? 'animate-spin text-primary' : ''}`}
            title="Sinkronisasi Data Terbaru"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <p className="text-slate-500 mb-8 text-sm">Silakan masuk untuk melanjutkan.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
             <AlertTriangle size={16}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {targetRole === 'STUDENT' ? 'NISN' : 'Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {targetRole === 'STUDENT' ? <KeyRound size={18} className="text-slate-400"/> : <UserIcon size={18} className="text-slate-400"/>}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder={targetRole === 'STUDENT' ? 'Masukkan NISN...' : 'Masukkan username...'}
                required
              />
            </div>
          </div>

          {targetRole !== 'STUDENT' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400"/>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="Masukkan password..."
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            Masuk
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
            {!showResetConfirm ? (
                <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    title="Klik jika Anda tidak bisa login karena data korup"
                >
                    <AlertTriangle size={12} /> Reset App (Darurat)
                </button>
            ) : (
                <div className="flex flex-col items-center bg-red-50 p-3 rounded-lg w-full animate-fade-in-up">
                    <p className="text-xs text-red-600 font-bold mb-2 text-center">Hapus semua data & reset ke default?</p>
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-1 px-2 bg-white border border-slate-200 text-slate-600 rounded text-xs">Batal</button>
                        <button onClick={executeReset} className="flex-1 py-1 px-2 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600">Ya, Reset</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
