import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, LogOut, FileText, Settings, Award, Home, UserCheck, Shield } from 'lucide-react';
import { Role, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <div className="min-h-screen bg-bgLight">{children}</div>;
  }

  const isActive = (path: string) => location.pathname === path ? 'bg-primary text-white shadow-lg' : 'text-slate-600 hover:bg-indigo-50 hover:text-primary';

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive(to)}`}>
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-3 shadow-lg">
            <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="font-display font-bold text-xl text-center text-slate-800 leading-tight">
            SENJA DIGITAL<br/><span className="text-sm font-normal text-slate-500">SDN 5 BILATO</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {user.role === Role.ADMIN && (
            <>
              <div className="text-xs font-bold text-slate-400 uppercase px-4 mt-2 mb-1">Admin Menu</div>
              <NavItem to="/dashboard" icon={Home} label="Dashboard" />
              <NavItem to="/students" icon={Users} label="Daftar Siswa" />
              <NavItem to="/users" icon={UserCheck} label="Manajemen User" />
              <NavItem to="/materials" icon={BookOpen} label="Bahan Bacaan" />
              <NavItem to="/grading" icon={FileText} label="Hasil & Tugas" />
              <NavItem to="/settings" icon={Settings} label="Pengaturan" />
            </>
          )}

          {user.role === Role.TEACHER && (
            <>
              <div className="text-xs font-bold text-slate-400 uppercase px-4 mt-2 mb-1">Wali Kelas {user.classAssigned}</div>
              <NavItem to="/dashboard" icon={Home} label="Dashboard" />
              <NavItem to="/students" icon={Users} label="Daftar Siswa" />
              <NavItem to="/materials" icon={BookOpen} label="Input Bacaan" />
              <NavItem to="/grading" icon={FileText} label="Periksa Tugas" />
            </>
          )}

          {user.role === Role.STUDENT && (
            <>
              <div className="text-xs font-bold text-slate-400 uppercase px-4 mt-2 mb-1">Menu Siswa</div>
              <NavItem to="/student/read" icon={BookOpen} label="Bacaan Saya" />
              <NavItem to="/student/history" icon={Award} label="Riwayat & Sertifikat" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role === Role.STUDENT ? 'Siswa' : user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};