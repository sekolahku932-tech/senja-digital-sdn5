
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { Submission, User } from '../types';
import { Download, Award, Clock, AlertCircle } from 'lucide-react';

interface HistoryProps {
  currentUser: User;
}

export const StudentHistory: React.FC<HistoryProps> = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const all = storageService.getSubmissions();
    const mySubs = all
        .filter(s => s.studentNisn === currentUser.id)
        .sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    setSubmissions(mySubs);
  }, [currentUser]);

  const showNotify = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3000);
  };

  const generateCertificate = (sub: Submission) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImage = new Image();
    // Use stored background or default placeholder
    const storedBg = storageService.getCertBg();
    bgImage.src = storedBg || 'https://via.placeholder.com/800x600/e0e7ff/4f46e5?text=SERTIFIKAT';
    
    bgImage.crossOrigin = "Anonymous";

    bgImage.onload = () => {
      canvas.width = bgImage.width;
      canvas.height = bgImage.height;

      // Draw Background
      ctx.drawImage(bgImage, 0, 0);

      const w = canvas.width;
      const h = canvas.height;

      // Draw Name
      ctx.font = `bold ${w * 0.05}px "Fredoka", sans-serif`;
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(currentUser.name, w / 2, h * 0.45);

      // Draw Title
      ctx.font = `${w * 0.03}px "Inter", sans-serif`;
      ctx.fillStyle = '#475569';
      ctx.fillText(`Telah menyelesaikan literasi:`, w / 2, h * 0.55);
      
      ctx.font = `bold ${w * 0.035}px "Inter", sans-serif`;
      ctx.fillStyle = '#4f46e5';
      ctx.fillText(`"${sub.materialTitle}"`, w / 2, h * 0.62);

      // Draw Date
      ctx.font = `${w * 0.025}px "Inter", sans-serif`;
      ctx.fillStyle = '#64748b';
      const dateStr = new Date(sub.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      ctx.fillText(`Bilato, ${dateStr}`, w / 2, h * 0.75);

      // Download
      try {
        const link = document.createElement('a');
        link.download = `Sertifikat-${sub.studentName}-${sub.materialTitle}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showNotify("Sertifikat berhasil diunduh!");
      } catch (e) {
        showNotify("Gagal mengunduh. Browser mungkin memblokir download.");
      }
    };

    bgImage.onerror = () => {
      showNotify("Gagal memuat gambar background sertifikat. Pastikan URL valid.");
    };
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in-up">
           <AlertCircle size={18}/> {notification}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Riwayat & Sertifikat</h1>
        <p className="text-slate-500 text-sm">Lihat progress membaca dan download sertifikatmu.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Judul Bacaan</th>
                <th className="px-6 py-4">Tanggal Kirim</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Catatan Guru</th>
                <th className="px-6 py-4 text-right">Sertifikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">Belum ada riwayat literasi.</td>
                </tr>
              ) : (
                submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{sub.materialTitle}</td>
                        <td className="px-6 py-4 text-slate-500">
                            {new Date(sub.submittedAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                             <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                sub.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                                sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {sub.status === 'PENDING' && <Clock size={12}/>}
                                {sub.status === 'APPROVED' ? 'Disetujui' : sub.status === 'REJECTED' ? 'Perbaiki' : 'Menunggu'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                            {sub.teacherFeedback || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {sub.status === 'APPROVED' ? (
                                <button 
                                    onClick={() => generateCertificate(sub)}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                    <Download size={14}/> Unduh
                                </button>
                            ) : (
                                <span className="text-slate-300 text-xs flex justify-end items-center gap-1">
                                    <Award size={14}/> Terkunci
                                </span>
                            )}
                        </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Hidden Canvas for generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};
