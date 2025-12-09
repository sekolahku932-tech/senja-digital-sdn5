
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Student, User, Role } from '../types';
import { Plus, Trash2, Edit2, FileSpreadsheet, AlertCircle, Filter } from 'lucide-react';

interface StudentsProps {
  currentUser: User;
}

export const Students: React.FC<StudentsProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  
  // Custom Confirmation & Notification
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{msg: string, isError?: boolean} | null>(null);

  // Form State
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [classGrade, setClassGrade] = useState('1');
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadStudents();
    // Jika guru, set default class grade ke kelas ampuannya
    if (currentUser.role === Role.TEACHER && currentUser.classAssigned) {
        setClassGrade(currentUser.classAssigned);
    }
  }, [currentUser]);

  const showNotify = (msg: string, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadStudents = () => {
    const all = storageService.getStudents();
    if (currentUser.role === Role.TEACHER) {
      setStudents(all.filter(s => s.classGrade === currentUser.classAssigned));
    } else {
      setStudents(all);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = { nisn, name, gender, classGrade };
    storageService.saveStudent(student);
    loadStudents();
    closeModal();
    showNotify(isEdit ? "Data siswa diperbarui" : "Siswa berhasil ditambahkan");
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = () => {
    if (deleteId) {
        storageService.deleteStudent(deleteId);
        loadStudents();
        setDeleteId(null);
        showNotify("Siswa berhasil dihapus");
    }
  };

  const handleEdit = (s: Student) => {
    setNisn(s.nisn);
    setName(s.name);
    setGender(s.gender);
    setClassGrade(s.classGrade);
    setIsEdit(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNisn('');
    setName('');
    setGender('L');
    // Reset class grade sesuai role
    if (currentUser.role === Role.TEACHER && currentUser.classAssigned) {
        setClassGrade(currentUser.classAssigned);
    } else {
        setClassGrade('1');
    }
    setIsEdit(false);
  };

  const handleImport = () => {
    const lines = importText.split('\n');
    const newStudents: Student[] = [];
    
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(/[\t,]/).map(p => p.trim());
      if (parts.length >= 2) {
        newStudents.push({
          nisn: parts[0],
          name: parts[1],
          gender: (parts[2]?.toUpperCase() === 'P' ? 'P' : 'L'),
          // Jika Guru mengimport, paksa kelas ke kelas yang diampu, abaikan data excel
          classGrade: (currentUser.role === Role.TEACHER && currentUser.classAssigned) 
                      ? currentUser.classAssigned 
                      : (parts[3] || '1')
        });
      }
    });

    if (newStudents.length > 0) {
      storageService.importStudents(newStudents);
      loadStudents();
      setShowImport(false);
      setImportText('');
      showNotify(`Berhasil mengimpor ${newStudents.length} siswa.`);
    } else {
      showNotify("Format data tidak valid. Gunakan: NISN (tab) Nama", true);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium ${notification.isError ? 'bg-red-500' : 'bg-slate-800'}`}>
           {notification.msg}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
                  <div className="flex items-center gap-3 text-red-600 mb-3">
                      <AlertCircle size={24} />
                      <h3 className="text-lg font-bold">Hapus Siswa?</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm">Tindakan ini tidak dapat dibatalkan. Data siswa akan hilang permanen.</p>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                      <button onClick={executeDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">Ya, Hapus</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Daftar Siswa</h1>
          <p className="text-slate-500 text-sm">Kelola data siswa {currentUser.role === Role.TEACHER ? `Kelas ${currentUser.classAssigned || '...'}` : 'Semua Kelas'}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImport(true)} 
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileSpreadsheet size={18} />
            Import Excel
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Tambah Siswa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">NISN</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">L/P</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                      {currentUser.role === Role.TEACHER && !currentUser.classAssigned ? (
                          <span>Gagal memuat kelas Anda. Hubungi Admin untuk cek "Class Assigned" di user Anda.</span>
                      ) : (
                          "Belum ada data siswa."
                      )}
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.nisn} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{s.nisn}</td>
                    <td className="px-6 py-4">{s.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${s.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                        {s.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        {currentUser.role === Role.TEACHER ? (
                             <span className="font-bold text-primary">Kelas {s.classGrade}</span>
                        ) : (
                             `Kelas ${s.classGrade}`
                        )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(s)} className="text-slate-400 hover:text-primary"><Edit2 size={18}/></button>
                      <button onClick={() => confirmDelete(s.nisn)} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{isEdit ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">NISN</label>
                <input required type="text" value={nisn} onChange={e => setNisn(e.target.value)} disabled={isEdit} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Siswa</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                    <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full border p-2 rounded-lg">
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Kelas</label>
                    <select 
                        value={classGrade} 
                        onChange={e => setClassGrade(e.target.value)} 
                        className={`w-full border p-2 rounded-lg ${currentUser.role === Role.TEACHER ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                        disabled={currentUser.role === Role.TEACHER}
                    >
                        {[1,2,3,4,5,6].map(c => (
                            <option key={c} value={c.toString()}>{c}</option>
                        ))}
                    </select>
                    {currentUser.role === Role.TEACHER && (
                        <p className="text-[10px] text-slate-400 mt-1">*Otomatis sesuai kelas ampu</p>
                    )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-2">Import Data Siswa</h3>
            <p className="text-sm text-slate-500 mb-4">Copy data dari Excel dan paste di bawah ini.<br/>Format Kolom: NISN | Nama | L/P | Kelas</p>
            {currentUser.role === Role.TEACHER && (
                <div className="bg-amber-50 text-amber-700 p-2 rounded text-xs mb-3 flex items-center gap-2">
                    <Filter size={14} />
                    Data import akan otomatis diset ke Kelas {currentUser.classAssigned || '1'}
                </div>
            )}
            <textarea 
                value={importText} 
                onChange={e => setImportText(e.target.value)}
                className="w-full border p-2 rounded-lg h-40 font-mono text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder={`12345\tBudi\tL\t1\n67890\tSiti\tP\t1`}
            ></textarea>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
              <button onClick={handleImport} className="px-4 py-2 bg-emerald-500 text-white rounded-lg">Proses Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
