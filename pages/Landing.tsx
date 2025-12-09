import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, BookOpen, GraduationCap } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 relative overflow-hidden">
      
      {/* Decorative Circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

      <div className="bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-3xl shadow-2xl max-w-4xl w-full text-center z-10">
        <div className="mb-8">
          <div className="inline-flex p-4 rounded-full bg-indigo-100 mb-6">
            <BookOpen className="text-indigo-600 w-12 h-12" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-800 mb-2">SENJA DIGITAL</h1>
          <p className="text-xl text-slate-600">SD NEGERI 5 BILATO</p>
          <p className="text-sm text-slate-400 mt-2">Platform Literasi Digital Interaktif</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/login/admin" className="group p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Shield size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Admin</h3>
            <p className="text-sm text-slate-500">Masuk sebagai Administrator</p>
          </Link>

          <Link to="/login/teacher" className="group p-6 rounded-2xl border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Wali Kelas</h3>
            <p className="text-sm text-slate-500">Masuk sebagai Guru</p>
          </Link>

          <Link to="/login/student" className="group p-6 rounded-2xl border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Siswa</h3>
            <p className="text-sm text-slate-500">Masuk menggunakan NISN</p>
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-white/80 text-sm">
        &copy; {new Date().getFullYear()} SD Negeri 5 Bilato. All rights reserved.
      </div>
    </div>
  );
};