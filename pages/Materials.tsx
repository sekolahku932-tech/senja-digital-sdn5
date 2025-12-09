
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { generateQuestions } from '../services/geminiService';
import { Material, User, Role, Question } from '../types';
import { Plus, Trash2, Edit2, Sparkles, Loader2, Video, FileText, Link as LinkIcon, AlertCircle, MessageSquarePlus } from 'lucide-react';

interface MaterialsProps {
  currentUser: User;
}

export const Materials: React.FC<MaterialsProps> = ({ currentUser }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Custom Confirmation & Notification
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{msg: string, isError?: boolean} | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [classGrade, setClassGrade] = useState('1');
  const [type, setType] = useState<'PDF' | 'VIDEO' | 'ARTICLE'>('ARTICLE');
  const [contentUrl, setContentUrl] = useState('');
  const [description, setDescription] = useState('');
  const [taskInstruction, setTaskInstruction] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
    // Default class for teacher
    if (currentUser.role === Role.TEACHER && currentUser.classAssigned) {
        setClassGrade(currentUser.classAssigned);
    }
  }, [currentUser]);

  const showNotify = (msg: string, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadMaterials = () => {
    const all = storageService.getMaterials();
    if (currentUser.role === Role.TEACHER) {
      setMaterials(all.filter(m => m.classGrade === currentUser.classAssigned));
    } else {
      setMaterials(all);
    }
  };

  const handleGenerateAI = async () => {
    if (!title) {
        showNotify("Isi judul terlebih dahulu untuk membuat soal otomatis.", true);
        return;
    }
    setIsGenerating(true);
    const result = await generateQuestions(title, description, classGrade);
    setQuestions(result);
    setIsGenerating(false);
    showNotify("Soal refleksi berhasil dibuat oleh AI!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const material: Material = {
      id: editId || `mat_${Date.now()}`,
      title,
      classGrade,
      type,
      contentUrl,
      description,
      taskInstruction,
      reflectionQuestions: questions,
      coverImage: `https://picsum.photos/400/300?random=${Date.now()}` // Mock image
    };
    storageService.saveMaterial(material);
    loadMaterials();
    closeModal();
    showNotify("Bahan bacaan berhasil disimpan.");
  };

  const handleEdit = (m: Material) => {
    setEditId(m.id);
    setTitle(m.title);
    setClassGrade(m.classGrade);
    setType(m.type);
    setContentUrl(m.contentUrl);
    setDescription(m.description || '');
    setTaskInstruction(m.taskInstruction || '');
    setQuestions(m.reflectionQuestions);
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  }
  
  const executeDelete = () => {
    if (deleteId) {
        storageService.deleteMaterial(deleteId);
        loadMaterials();
        setDeleteId(null);
        showNotify("Bahan bacaan dihapus.");
    }
  }

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setTitle('');
    setContentUrl('');
    setDescription('');
    setTaskInstruction('');
    setQuestions([]);
    // Reset class default
    if (currentUser.role === Role.TEACHER && currentUser.classAssigned) {
        setClassGrade(currentUser.classAssigned);
    } else {
        setClassGrade('1');
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: `q_${Date.now()}`, text: '', type: 'text' }]);
  };

  const updateQuestion = (idx: number, text: string) => {
    const newQ = [...questions];
    newQ[idx].text = text;
    setQuestions(newQ);
  };

  const removeQuestion = (idx: number) => {
    const newQ = [...questions];
    newQ.splice(idx, 1);
    setQuestions(newQ);
  }

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
                      <h3 className="text-lg font-bold">Hapus Materi?</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm">Materi bacaan akan dihapus permanen.</p>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                      <button onClick={executeDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">Ya, Hapus</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Bahan Bacaan</h1>
          <p className="text-slate-500 text-sm">Kelola materi literasi dan soal refleksi.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Tambah Materi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
                <div className="h-40 bg-slate-200 relative overflow-hidden">
                    <img src={m.coverImage} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-700">
                        Kelas {m.classGrade}
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{m.title}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{m.description}</p>
                    <div className="flex items-center justify-between mt-4">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                            {m.type === 'VIDEO' ? <Video size={14}/> : <FileText size={14}/>}
                            {m.type}
                        </span>
                        <div className="flex gap-2">
                             <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                             <button onClick={() => confirmDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-8 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editId ? 'Edit Materi' : 'Tambah Materi Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Judul</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Judul Bacaan"/>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Kelas</label>
                    <select 
                        value={classGrade} 
                        onChange={e => setClassGrade(e.target.value)} 
                        className={`w-full border p-2 rounded-lg ${currentUser.role === Role.TEACHER ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                        disabled={currentUser.role === Role.TEACHER}
                    >
                        {[1,2,3,4,5,6].map(c => <option key={c} value={c.toString()}>{c}</option>)}
                    </select>
                    {currentUser.role === Role.TEACHER && <p className="text-[10px] text-slate-400 mt-1">*Otomatis sesuai kelas ampu</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Ringkasan cerita..."></textarea>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Tipe</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border p-2 rounded-lg">
                        <option value="ARTICLE">Artikel/Cerita</option>
                        <option value="PDF">Dokumen PDF</option>
                        <option value="VIDEO">Video Youtube</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">URL / Link Konten</label>
                    <div className="flex items-center gap-2">
                         <LinkIcon size={18} className="text-slate-400" />
                        <input required type="url" value={contentUrl} onChange={e => setContentUrl(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="https://..."/>
                    </div>
                </div>
              </div>

              {/* NEW TASK INSTRUCTION FIELD */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <label className="block text-sm font-bold text-orange-900 mb-1 flex items-center gap-2">
                    <MessageSquarePlus size={16}/> Perintah Tugas Tambahan (Opsional)
                </label>
                <textarea 
                    rows={2} 
                    value={taskInstruction} 
                    onChange={e => setTaskInstruction(e.target.value)} 
                    className="w-full border border-orange-200 p-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm" 
                    placeholder="Contoh: Buatlah rangkuman di buku tulis lalu foto dan upload di sini. Atau buatlah video menceritakan kembali..."
                ></textarea>
                <p className="text-[10px] text-orange-600 mt-1">
                    *Instruksi ini akan muncul di halaman siswa pada bagian upload tugas.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700">Soal Refleksi</h4>
                    <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                        {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                        Bantu Buat Soal (AI)
                    </button>
                </div>
                
                <div className="space-y-3">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="flex gap-2 items-start">
                            <span className="text-sm font-bold text-slate-400 py-2">{idx + 1}.</span>
                            <input 
                                type="text" 
                                value={q.text} 
                                onChange={e => updateQuestion(idx, e.target.value)}
                                className="flex-1 border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Pertanyaan..."
                            />
                            <button type="button" onClick={() => removeQuestion(idx)} className="text-red-400 p-2 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={addQuestion} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                        <Plus size={14}/> Tambah Pertanyaan Manual
                    </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Simpan Materi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
