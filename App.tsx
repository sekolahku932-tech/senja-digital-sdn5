import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Materials } from './pages/Materials';
import { ReadingRoom } from './pages/ReadingRoom';
import { Grading } from './pages/Grading';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { StudentHistory } from './pages/StudentHistory';
import { User, Role } from './types';
import { storageService } from './services/storageService';

// Simple Auth persistence
const getUserFromStorage = (): User | null => {
  const stored = localStorage.getItem('senja_active_user');
  return stored ? JSON.parse(stored) : null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getUserFromStorage);

  useEffect(() => {
    // Attempt auto-sync on load to get fresh data
    const initSync = async () => {
       if (storageService.getDbUrl()) {
          console.log("Auto-syncing data...");
          await storageService.syncFromCloud();
       }
    };
    initSync();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('senja_active_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('senja_active_user');
  };

  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <Landing /> : <Navigate to={user.role === Role.STUDENT ? "/student/read" : "/dashboard"} />} />
        <Route path="/login/:role" element={<Login onLogin={handleLogin} />} />

        {/* Protected Routes */}
        <Route
          path="*"
          element={
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                {/* Admin/Teacher Routes */}
                <Route path="/dashboard" element={user && user.role !== Role.STUDENT ? <Dashboard user={user} /> : <Navigate to="/" />} />
                <Route path="/students" element={user && user.role !== Role.STUDENT ? <Students currentUser={user} /> : <Navigate to="/" />} />
                <Route path="/materials" element={user && user.role !== Role.STUDENT ? <Materials currentUser={user} /> : <Navigate to="/" />} />
                <Route path="/grading" element={user && user.role !== Role.STUDENT ? <Grading currentUser={user} /> : <Navigate to="/" />} />
                
                {/* Admin Only Routes */}
                <Route path="/settings" element={user && user.role === Role.ADMIN ? <Settings /> : <Navigate to="/" />} />
                <Route path="/users" element={user && user.role === Role.ADMIN ? <Users /> : <Navigate to="/" />} />

                {/* Student Routes */}
                <Route path="/student/read" element={user && user.role === Role.STUDENT ? <ReadingRoom currentUser={user} /> : <Navigate to="/" />} />
                <Route path="/student/history" element={user && user.role === Role.STUDENT ? <StudentHistory currentUser={user} /> : <Navigate to="/" />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;