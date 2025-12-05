import React, { useState, useRef } from 'react';
import { Material, Submission, Student, AppSettings, FileAttachment } from '../types';
import { Save, CheckCircle, Download, BookOpen, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';

interface StudentViewProps {
  student: Student;
  materials: Material[];
  settings: AppSettings;
  submissions: Submission[];
  onSubmit: (submission: Submission) => void;
}

const StudentView: React.FC<StudentViewProps> = ({ student, materials, settings, submissions, onSubmit }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [answerAttachments, setAnswerAttachments] = useState<{[key: string]: FileAttachment}>({});
  
  const [taskResponse, setTaskResponse] = useState('');
  const [taskAttachments, setTaskAttachments] = useState<FileAttachment[]>([]);
  
  const certRef = useRef<HTMLDivElement>(null);

  // Filter materials for student's grade
  const classMaterials = materials.filter(m => m.grade === student.grade);

  const handleRead = (material: Material) => {
    setSelectedMaterial(material);
    setAnswers({});
    setAnswerAttachments({});
    setTaskResponse('');
    setTaskAttachments([]);
  };

  const convertFileToBase64 = (file: File): Promise<FileAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        data: reader.result as string
      });
      reader.onerror = error => reject(error);
    });
  };

  const handleAnswerFileChange = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit check
         alert("Ukuran file terlalu besar (Maks 2MB)");
         return;
      }
      try {
        const attachment = await convertFileToBase64(file);
        setAnswerAttachments(prev => ({ ...prev, [questionId]: attachment }));
      } catch (err) {
        alert("Gagal membaca file");
      }
    }
  };

  const handleTaskFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       if (file.size > 2 * 1024 * 1024) { 
         alert("Ukuran file terlalu besar (Maks 2MB)");
         return;
      }
       try {
         const attachment = await convertFileToBase64(file);
         setTaskAttachments(prev => [...prev, attachment]);
       } catch (err) {
         alert("Gagal membaca file");
       }
    }
  };

  const removeTaskAttachment = (index: number) => {
    setTaskAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedMaterial) return;
    
    // Validate
    const missing = selectedMaterial.questions.some(q => !answers[q.id]);
    if (missing || !taskResponse.trim()) {
      alert("Mohon lengkapi semua jawaban refleksi dan narasi tugas sebelum mengirim.");
      return;
    }

    const submission: Submission = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      materialId: selectedMaterial.id,
      materialTitle: selectedMaterial.title,
      answers: selectedMaterial.questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id],
        attachment: answerAttachments[q.id]
      })),
      taskResponse,
      taskAttachments: taskAttachments,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      grade: student.grade
    };

    onSubmit(submission);
    alert("Berhasil dikirim! Guru akan memeriksa jawabanmu.");
    setSelectedMaterial(null);
  };

  const getSubmissionStatus = (materialId: string) => {
    return submissions.find(s => s.materialId === materialId && s.studentId === student.id);
  };

  const handlePrintCert = (sub: Submission) => {
      const printContent = `
        <html>
        <head>
          <title>Sertifikat Literasi</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: 'Arial', sans-serif; }
            .cert-container {
              position: relative;
              width: 100%;
              height: 100%;
              background-image: url('${settings.certBackground}');
              background-size: cover;
              background-position: center;
              text-align: center;
              color: #000;
            }
            .content {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 80%;
            }
            h1 { font-size: 48px; margin-bottom: 20px; color: #1e3a8a; }
            h2 { font-size: 32px; margin: 10px 0; }
            p { font-size: 24px; }
            .highlight { font-weight: bold; color: #d97706; border-bottom: 2px solid #d97706; display: inline-block; min-width: 300px;}
          </style>
        </head>
        <body>
          <div class="cert-container">
            <div class="content">
              <h1>SERTIFIKAT LITERASI</h1>
              <p>Diberikan kepada:</p>
              <h2 class="highlight">${student.name}</h2>
              <p>Siswa Kelas ${student.grade}</p>
              <br/>
              <p>Telah berhasil menyelesaikan bacaan dan tugas:</p>
              <h2 class="highlight">${sub.materialTitle}</h2>
              <br/>
              <p>SD NEGERI 5 BILATO</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
        </html>
      `;
      const win = window.open('', '', 'width=1000,height=700');
      if (win) {
        win.document.write(printContent);
        win.document.close();
      }
  };

  if (selectedMaterial) {
    const existingSub = getSubmissionStatus(selectedMaterial.id);
    
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-brand-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">{selectedMaterial.title}</h2>
            <button onClick={() => setSelectedMaterial(null)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded">
                Kembali
            </button>
        </div>
        
        <div className="p-6 space-y-8">
            {/* Content Area */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold mb-4 text-brand-700">Materi Pembelajaran</h3>
                
                {selectedMaterial.type === 'image' && (
                    <div className="flex justify-center bg-gray-100 rounded p-4">
                        <img src={selectedMaterial.url} alt="Materi" className="max-w-full max-h-[500px] object-contain rounded shadow" />
                    </div>
                )}

                {selectedMaterial.type === 'video' && (
                    <div className="aspect-w-16 aspect-h-9 bg-black rounded flex items-center justify-center text-white min-h-[300px]">
                         {selectedMaterial.url.includes('youtube') ? (
                             <iframe 
                                src={selectedMaterial.url.replace('watch?v=', 'embed/')} 
                                className="w-full h-full"
                                title="Content"
                                allowFullScreen
                             />
                         ) : selectedMaterial.url.startsWith('data:') ? (
                              <video src={selectedMaterial.url} controls className="w-full h-full max-h-[500px]" />
                         ) : (
                             <a href={selectedMaterial.url} target="_blank" rel="noreferrer" className="underline text-blue-400">
                                 Tonton Video di Tab Baru
                             </a>
                         )}
                    </div>
                )}
                
                {selectedMaterial.type === 'pdf' && (
                     <div className="bg-gray-100 p-8 text-center rounded">
                         <a href={selectedMaterial.url} target="_blank" download="Materi.pdf" rel="noreferrer" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition">
                            <BookOpen className="w-5 h-5" />
                            {selectedMaterial.url.startsWith('data:') ? 'Download Materi PDF' : 'Buka Materi PDF / Artikel'}
                         </a>
                     </div>
                )}
                
                {selectedMaterial.type === 'article' && (
                    <div className="prose max-w-none">
                        <a href={selectedMaterial.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Baca Artikel Sumber</a>
                    </div>
                )}
            </div>

            {/* Reflection Form */}
            {!existingSub || existingSub.status !== 'approved' ? (
              <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 text-brand-700 font-bold text-lg border-b pb-2">
                         <span className="bg-brand-100 p-1 rounded">1</span>
                         <h3>Refleksi Diri</h3>
                      </div>
                      <div className="space-y-6">
                          {selectedMaterial.questions.map((q) => (
                              <div key={q.id} className="bg-white p-4 border rounded-lg shadow-sm">
                                  <label className="block text-sm font-bold text-gray-800 mb-2">{q.text}</label>
                                  <textarea
                                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none mb-2"
                                      rows={2}
                                      value={answers[q.id] || ''}
                                      onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                      placeholder="Jawab disini..."
                                  />
                                  {/* File Upload for Question */}
                                  <div className="flex items-center gap-2">
                                      <label className="cursor-pointer flex items-center gap-2 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200 transition">
                                          <Paperclip className="w-3 h-3" /> 
                                          {answerAttachments[q.id] ? 'Ganti File' : 'Upload Bukti (Opsional)'}
                                          <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(e) => handleAnswerFileChange(q.id, e)} />
                                      </label>
                                      {answerAttachments[q.id] && (
                                          <span className="text-xs text-brand-600 truncate max-w-[150px] flex items-center gap-1">
                                            {answerAttachments[q.id].type.startsWith('image') ? <ImageIcon className="w-3 h-3"/> : <FileText className="w-3 h-3"/>}
                                            {answerAttachments[q.id].name}
                                          </span>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="flex items-center gap-2 text-brand-700 font-bold text-lg border-b pb-2">
                         <span className="bg-brand-100 p-1 rounded">2</span>
                         <h3>Tugas / Aksi Nyata</h3>
                      </div>
                      <div className="bg-orange-50 p-4 rounded border border-orange-200 text-sm text-orange-800">
                          {selectedMaterial.taskDescription}
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban / Narasi Tugas:</label>
                          <textarea
                              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none mb-4"
                              rows={4}
                              value={taskResponse}
                              onChange={e => setTaskResponse(e.target.value)}
                              placeholder="Ceritakan hasil tugasmu atau tempel link Google Drive/Youtube..."
                          />
                          
                          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File/Foto Tugas (Max 2MB):</label>
                          <div className="flex flex-col gap-2">
                              {taskAttachments.map((file, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-gray-50 border p-2 rounded text-sm">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          {file.type.startsWith('image') ? <ImageIcon className="w-4 h-4 text-purple-500"/> : <FileText className="w-4 h-4 text-blue-500"/>}
                                          <span className="truncate">{file.name}</span>
                                      </div>
                                      <button onClick={() => removeTaskAttachment(idx)} className="text-red-500 hover:text-red-700">
                                          <X className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))}
                              
                              <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition">
                                  <Paperclip className="w-6 h-6 text-gray-400 mb-1" />
                                  <span className="text-xs text-gray-500">Klik untuk upload file</span>
                                  <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleTaskFileChange} />
                              </label>
                          </div>
                      </div>
                  </div>
              </div>
            ) : (
                <div className="bg-green-100 p-6 rounded-xl text-center border border-green-200">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-green-800">Selamat!</h3>
                    <p className="text-green-700">Kamu sudah menyelesaikan materi ini dan tugasmu sudah disetujui Guru.</p>
                </div>
            )}

            {/* Action Bar */}
            <div className="pt-6 border-t flex justify-end">
                {(!existingSub || existingSub.status === 'rejected') && (
                     <button onClick={handleSubmit} className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-lg hover:bg-brand-700 shadow-lg font-bold">
                        <Save className="w-5 h-5" />
                        Kirim Jawaban
                     </button>
                )}
                 {existingSub && existingSub.status === 'pending' && (
                     <span className="text-orange-500 font-medium italic">Sedang diperiksa guru...</span>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
         <h2 className="text-2xl font-bold text-gray-800 mb-2">Halo, {student.name}!</h2>
         <p className="text-gray-600">Selamat datang di Kelas {student.grade}. Ayo membaca dan berkarya!</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classMaterials.map(m => {
            const sub = getSubmissionStatus(m.id);
            const isDone = sub?.status === 'approved';
            
            return (
              <div key={m.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                  <div className={`h-3 bg-${isDone ? 'green' : 'brand'}-500 w-full`}></div>
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${m.type === 'video' ? 'bg-red-100 text-red-600' : m.type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                              {m.type}
                          </span>
                          {isDone && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{m.title}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-3">{m.taskDescription}</p>
                      
                      <div className="flex gap-2 mt-auto">
                        <button 
                            onClick={() => handleRead(m)}
                            className="flex-1 bg-brand-50 text-brand-600 py-2 rounded-lg font-semibold hover:bg-brand-100 transition"
                        >
                            {isDone ? 'Lihat Kembali' : sub ? 'Revisi' : 'Mulai Baca'}
                        </button>
                        {isDone && (
                            <button 
                                onClick={() => sub && handlePrintCert(sub)}
                                className="px-3 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100"
                                title="Unduh Sertifikat"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        )}
                      </div>
                  </div>
              </div>
            );
          })}
          {classMaterials.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                  Belum ada bahan bacaan untuk kelasmu.
              </div>
          )}
      </div>
      <div style={{display: 'none'}}>
        <div ref={certRef}></div>
      </div>
    </div>
  );
};

export default StudentView;