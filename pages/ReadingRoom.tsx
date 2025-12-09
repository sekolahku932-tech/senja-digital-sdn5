
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, Material, Submission } from '../types';
import { BookOpen, CheckCircle, Upload, Maximize2, ExternalLink, AlertCircle, MessageSquare } from 'lucide-react';

interface ReadingRoomProps {
  currentUser: User;
}

export const ReadingRoom: React.FC<ReadingRoomProps> = ({ currentUser }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [taskFile, setTaskFile] = useState<string>(''); // Placeholder for file upload
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Filter materials by student class
    const all = storageService.getMaterials();
    setMaterials(all.filter(m => m.classGrade === currentUser.classAssigned));
  }, [currentUser]);

  const handleRead = (m: Material) => {
    setSelectedMaterial(m);
    setAnswers({});
    setTaskFile('');
    setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    const submission: Submission = {
        id: `sub_${Date.now()}`,
        studentNisn: currentUser.id,
        studentName: currentUser.name,
        materialId: selectedMaterial.id,
        materialTitle: selectedMaterial.title,
        answers,
        taskFile,
        status: 'PENDING',
        submittedAt: new Date().toISOString()
    };

    storageService.saveSubmission(submission);
    setSubmitted(true);
    setTimeout(() => {
        setSelectedMaterial(null); // Return to library
    }, 2000);
  };

  // Helper to process URLs for embedding (YouTube, etc)
  const getEmbedUrl = (url: string, type: string) => {
    if (!url) return '';
    
    if (type === 'VIDEO') {
        // Convert YouTube watch URL to Embed URL
        // Match: youtube.com/watch?v=ID or youtu.be/ID
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
    }
    
    // For Google Drive preview links, ensure /preview is used instead of /view
    if (url.includes('drive.google.com') && url.includes('/view')) {
        return url.replace('/view', '/preview');
    }

    return url;
  };

  if (selectedMaterial) {
    const embedUrl = getEmbedUrl(selectedMaterial.contentUrl, selectedMaterial.type);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button onClick={() => setSelectedMaterial(null)} className="text-sm text-slate-500 hover:text-primary mb-2 flex items-center gap-1">
                &larr; Kembali ke Perpustakaan
            </button>
            
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Content Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{selectedMaterial.type}</span>
                             <span className="text-slate-400 text-xs">Kelas {selectedMaterial.classGrade}</span>
                        </div>
                        <h1 className="text-2xl font-display font-bold text-slate-800">{selectedMaterial.title}</h1>
                        <p className="text-slate-600 text-sm mt-1">{selectedMaterial.description}</p>
                    </div>
                </div>

                {/* Content Viewer (Iframe) */}
                <div className="bg-slate-900 w-full relative group">
                    <div className="aspect-video w-full md:h-[500px]">
                        <iframe 
                            src={embedUrl}
                            className="w-full h-full"
                            title={selectedMaterial.title}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    </div>
                    
                    {/* Fallback Link Overlay (Visible on Hover or if needed) */}
                    <div className="bg-slate-800 text-slate-300 text-xs p-2 text-center flex items-center justify-center gap-2">
                        <AlertCircle size={12} />
                        <span>Konten tidak muncul? </span>
                        <a href={selectedMaterial.contentUrl} target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-primary flex items-center gap-1 font-bold">
                            Buka di Tab Baru <ExternalLink size={10} />
                        </a>
                    </div>
                </div>

                <div className="p-8">
                    {!submitted ? (
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Questions Column */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-primary flex items-center justify-center">
                                        <BookOpen size={18}/>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Refleksi Materi</h3>
                                </div>
                                
                                <form id="submissionForm" onSubmit={handleSubmit} className="space-y-6">
                                    {selectedMaterial.reflectionQuestions.map((q, idx) => (
                                        <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <label className="block font-bold text-slate-700 mb-2 text-sm">{idx+1}. {q.text}</label>
                                            <textarea 
                                                required
                                                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
                                                rows={3}
                                                value={answers[q.id] || ''}
                                                onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                                placeholder="Tulis jawabanmu disini..."
                                            ></textarea>
                                        </div>
                                    ))}
                                </form>
                            </div>

                            {/* Upload & Submit Column */}
                            <div className="space-y-6">
                                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 sticky top-4">
                                    <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                        <Upload size={18}/> Tugas Karya
                                    </h4>
                                    
                                    {/* DYNAMIC INSTRUCTION DISPLAY */}
                                    <div className="text-sm text-orange-800 mb-4 leading-relaxed bg-white/50 p-3 rounded-lg border border-orange-100">
                                        {selectedMaterial.taskInstruction ? (
                                            <>
                                                <div className="flex items-center gap-2 font-bold mb-1 text-orange-900 text-xs uppercase">
                                                    <MessageSquare size={12}/> Perintah Guru:
                                                </div>
                                                <p className="italic">"{selectedMaterial.taskInstruction}"</p>
                                            </>
                                        ) : (
                                            <p className="text-xs">Apakah ada tugas membuat ringkasan, gambar, atau video dari gurumu? Upload file tersebut di sini.</p>
                                        )}
                                    </div>
                                    
                                    <div className="border-2 border-dashed border-orange-200 rounded-lg p-4 text-center bg-white cursor-pointer hover:bg-orange-50 transition-colors relative mb-4">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={() => setTaskFile('dummy_url_base64_simulated')} // Simulate upload
                                        />
                                        <Upload size={24} className="mx-auto text-orange-300 mb-2"/>
                                        <span className="text-xs font-bold text-orange-400 block">
                                            {taskFile ? 'File Terpilih' : 'Pilih File'}
                                        </span>
                                    </div>

                                    <button 
                                        type="submit" 
                                        form="submissionForm"
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18}/>
                                        Kirim Jawaban
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 animate-fade-in-up">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-3xl font-display font-bold text-slate-800 mb-2">Luar Biasa!</h3>
                            <p className="text-slate-500 mb-6">Jawaban dan tugasmu telah berhasil dikirim ke Ibu/Bapak Guru.</p>
                            <button onClick={() => setSelectedMaterial(null)} className="text-primary font-bold hover:underline">
                                Kembali ke Perpustakaan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">Perpustakaan Digital</h1>
            <p className="text-slate-500 text-sm">Selamat datang, <span className="font-bold text-primary">{currentUser.name}</span>! Ayo membaca hari ini.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">
             Kelas {currentUser.classAssigned}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {materials.map(m => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full flex flex-col" onClick={() => handleRead(m)}>
                    <div className="h-48 overflow-hidden relative">
                         <img src={m.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                         <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            {m.type}
                         </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-display font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">{m.title}</h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-3 flex-1">{m.description}</p>
                        <div className="mt-auto">
                            <button className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-primary py-2.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
                                <BookOpen size={16}/> Baca Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            {materials.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <BookOpen size={48} className="mb-3 opacity-20"/>
                    <p>Belum ada bahan bacaan untuk kelasmu.</p>
                </div>
            )}
        </div>
    </div>
  );
};
