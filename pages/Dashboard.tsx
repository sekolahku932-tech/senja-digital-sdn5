
import React, { useMemo } from 'react';
import { User, Role } from '../types';
import { storageService } from '../services/storageService';

export const Dashboard: React.FC<{ user: User }> = ({ user }) => {
    const students = storageService.getStudents();
    const materials = storageService.getMaterials();
    const submissions = storageService.getSubmissions();

    // Calculate stats based on role
    const stats = useMemo(() => {
        if (user.role === Role.TEACHER && user.classAssigned) {
            // Filter for Teacher
            const classStudents = students.filter(s => s.classGrade === user.classAssigned);
            const classMaterials = materials.filter(m => m.classGrade === user.classAssigned);
            
            // Filter submissions from students in this class
            const studentNisns = classStudents.map(s => s.nisn);
            const classSubmissions = submissions.filter(sub => studentNisns.includes(sub.studentNisn));

            return {
                studentCount: classStudents.length,
                materialCount: classMaterials.length,
                submissionCount: classSubmissions.length,
                labelPrefix: `Kelas ${user.classAssigned}`
            };
        } else {
            // Admin sees all
            return {
                studentCount: students.length,
                materialCount: materials.length,
                submissionCount: submissions.length,
                labelPrefix: 'Total'
            };
        }
    }, [user, students, materials, submissions]);

    const statCard = (label: string, value: number, color: string) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
            <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary to-indigo-600 p-8 rounded-2xl shadow-lg text-white">
                <h1 className="text-3xl font-display font-bold mb-2">Halo, {user.name} 👋</h1>
                <p className="opacity-90">
                    Selamat datang di Panel Kontrol Senja Digital. 
                    {user.role === Role.TEACHER && ` Anda login sebagai Wali Kelas ${user.classAssigned}.`}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCard(`${stats.labelPrefix} Siswa`, stats.studentCount, 'text-blue-600')}
                {statCard(`${stats.labelPrefix} Bahan Bacaan`, stats.materialCount, 'text-pink-600')}
                {statCard(`${stats.labelPrefix} Tugas Masuk`, stats.submissionCount, 'text-amber-600')}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Informasi Sekolah</h3>
                <p className="text-slate-600 leading-relaxed">
                    Aplikasi ini dirancang untuk meningkatkan literasi digital siswa melalui metode interaktif yang menyenangkan. 
                    Gunakan fitur <b>AI Generator</b> di menu Bahan Bacaan untuk membantu membuat soal refleksi secara otomatis.
                </p>
            </div>
        </div>
    );
};
