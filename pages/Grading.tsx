
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Submission, User, Role } from '../types';
import { Check, X, MessageSquare, Award, Filter } from 'lucide-react';

interface GradingProps {
  currentUser: User;
}

export const Grading: React.FC<GradingProps> = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [feedback, setFeedback] = useState('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [currentUser]);

  const loadSubmissions = () => {
    const allSubmissions = storageService.getSubmissions();
    
    // Jika user adalah GURU, filter berdasarkan kelas siswanya
    if (currentUser.role === Role.TEACHER && currentUser.classAssigned) {
        const allStudents = storageService.getStudents();
        
        // Buat Map sederhana: NISN -> Kelas
        const studentClassMap = new Map<string, string>();
        allStudents.forEach(s => studentClassMap.set(s.nisn, s.classGrade));

        // Filter submission yang siswanya berada di kelas guru tersebut
        const classSubmissions = allSubmissions.filter(sub => {
            const sClass = studentClassMap.get(sub.studentNisn);
            return sClass === currentUser.classAssigned;
        });

        setSubmissions(classSubmissions.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    } else {
        // Jika Admin, tampilkan semua
        setSubmissions(allSubmissions.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }
  };

  const handleGrade = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedSub) return;
    const updated: Submission = {
        ...selectedSub,
        status,
        teacherFeedback: feedback
    };
    storageService.saveSubmission(updated);
    setSelectedSub(null);
    setFeedback('');
    loadSubmissions();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold text-slate-800">Hasil & Tugas Siswa</h1>
        {currentUser.role === Role.TEACHER && (
             <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Filter size={12}/> Filter: Kelas {currentUser.classAssigned}
             </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
            {submissions.map(sub => (
                <div 
                    key={sub.id} 
                    onClick={() => setSelectedSub(sub)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedSub?.id === sub.id ? 'border-primary bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-slate-800">{sub.studentName}</h4>
                            <p className="text-xs text-slate-500">{sub.materialTitle}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            sub.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                            sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {sub.status}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-xs text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                        {currentUser.role === Role.ADMIN && (
                             <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">NISN: {sub.studentNisn}</span>
                        )}
                    </div>
                </div>
            ))}
            {submissions.length === 0 && (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">Belum ada tugas masuk untuk kelas ini.</p>
                </div>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit sticky top-4">
            {selectedSub ? (
                <div className="animate-fade-in-up">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Detail Jawaban</h3>
                    <div className="space-y-4 mb-6">
                        {Object.entries(selectedSub.answers).map(([qid, ans], idx) => (
                            <div key={qid} className="bg-slate-50 p-3 rounded-lg">
                                <span className="text-xs font-bold text-slate-400 block mb-1">Pertanyaan {idx+1}</span>
                                <p className="text-slate-700 text-sm">{ans}</p>
                            </div>
                        ))}
                        {selectedSub.taskFile && (
                            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                                <Award size={16}/> File Tugas Terlampir (Simulasi)
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium">Catatan Guru</label>
                        <textarea 
                            className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" 
                            rows={3} 
                            placeholder="Berikan semangat atau koreksi..."
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                        ></textarea>
                        
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => handleGrade('REJECTED')} className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors">
                                <X size={16}/> Perbaiki
                            </button>
                            <button onClick={() => handleGrade('APPROVED')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 font-medium text-sm transition-colors shadow-lg shadow-emerald-200">
                                <Check size={16}/> Setujui & Sertifikat
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400 py-12 flex flex-col items-center">
                    <MessageSquare size={48} className="mb-2 opacity-20"/>
                    <p>Pilih siswa dari daftar kiri untuk memeriksa tugas.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
