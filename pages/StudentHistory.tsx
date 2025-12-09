
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { Submission, User } from '../types';
import { Download, Award, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface HistoryProps {
  currentUser: User;
}

export const StudentHistory: React.FC<HistoryProps> = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notification, setNotification] = useState<{msg: string, isError?: boolean} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const all = storageService.getSubmissions();
    const mySubs = all
        .filter(s => s.studentNisn === currentUser.id)
        .sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    setSubmissions(mySubs);
  }, [currentUser]);

  const showNotify = (msg: string, isError = false) => {
      setNotification({ msg, isError });
      setTimeout(() => setNotification(null), 4000);
  };

  const drawTextContent = (ctx: CanvasRenderingContext2D, w: number, h: number, sub: Submission) => {
      // Helper untuk shadow & outline
      const drawTextWithOutline = (text: string, x: number, y: number, font: string, color: string) => {
          ctx.font = font;
          ctx.textAlign = 'center';
          
          // Outline (Stroke) agar terbaca di background gelap
          ctx.lineWidth = w * 0.006;
          ctx.strokeStyle = '#ffffff';
          ctx.strokeText(text, x, y);

          // Main Text
          ctx.fillStyle = color;
          ctx.fillText(text, x, y);
      };

      // 1. Nama Siswa
      drawTextWithOutline(currentUser.name, w / 2, h * 0.45, `bold ${w * 0.05}px "Fredoka", sans-serif`, '#1e293b');

      // 2. Teks Pengantar
      drawTextWithOutline('Telah menyelesaikan literasi:', w / 2, h * 0.55, `${w * 0.03}px "Inter", sans-serif`, '#475569');
      
      // 3. Judul Materi
      drawTextWithOutline(`"${sub.materialTitle}"`, w / 2, h * 0.62, `bold italic ${w * 0.035}px "Inter", sans-serif`, '#4f46e5');

      // 4. Tanggal
      const dateStr = new Date(sub.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      drawTextWithOutline(`Bilato, ${dateStr}`, w / 2, h * 0.75, `${w * 0.025}px "Inter", sans-serif`, '#64748b');
      
      // 5. Watermark Sekolah
      ctx.font = `italic ${w * 0.015}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillText('Senja Digital SDN 5 Bilato', w / 2, h * 0.92);
  };

  const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
      try {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotify("Sertifikat berhasil diunduh!");
      } catch (e) {
        console.error("CORS Error:", e);
        showNotify("Gagal mengunduh gambar background (Isu Keamanan Browser). Menggunakan background standar...", true);
        // Retry with simple background immediately
        return false;
      }
      return true;
  };

  const generateCertificate = (sub: Submission) => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderCertificate = (useImage: boolean, imgObj?: HTMLImageElement) => {
        // Set ukuran standar HD
        const WIDTH = 1200;
        const HEIGHT = 900;
        
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        if (useImage && imgObj) {
            ctx.drawImage(imgObj, 0, 0, WIDTH, HEIGHT);
        } else {
            // Fallback: Gradient Background
            const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
            // Elegant Blue-Purple Gradient
            grad.addColorStop(0, '#eef2ff');
            grad.addColorStop(1, '#c7d2fe');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            
            // Border or Decor
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 20;
            ctx.strokeRect(20, 20, WIDTH-40, HEIGHT-40);
            
            // Inner thin border
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(35, 35, WIDTH-70, HEIGHT-70);
        }

        drawTextContent(ctx, WIDTH, HEIGHT, sub);

        const success = downloadCanvas(canvas, `Sertifikat-${sub.studentName}-${sub.materialTitle}.png`);
        
        // Jika gagal pakai gambar (biasanya karena CORS/Tainted Canvas), ulang pakai background polos
        if (!success && useImage) {
            renderCertificate(false);
        }
        
        setIsGenerating(false);
    };

    const storedBg = storageService.getCertBg();

    // LOGIKA PERBAIKAN:
    // Hanya coba load gambar jika user benar-benar menyimpan background kustom.
    // Jika tidak ada, langsung render Gradient (tanpa fetch ke internet) agar tidak error.
    if (storedBg && storedBg.trim() !== '') {
        const bgImage = new Image();
        bgImage.crossOrigin = "Anonymous"; 
        bgImage.src = storedBg;

        bgImage.onload = () => renderCertificate(true, bgImage);
        
        bgImage.onerror = () => {
            console.warn("Image load error, falling back to gradient");
            renderCertificate(false);
        };
    } else {
        // Langsung pakai desain standar
        renderCertificate(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {notification && (
        <div className={`fixed top-24 right-4 z-50 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce ${notification.isError ? 'bg-amber-500' : 'bg-emerald-600'}`}>
           <AlertCircle size={18}/> {notification.msg}
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
                                    disabled={isGenerating}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                                    {isGenerating ? 'Memproses...' : 'Unduh'}
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
