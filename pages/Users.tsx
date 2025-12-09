
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, Role } from '../types';
import { Plus, Trash2, Edit2, Shield, User as UserIcon, AlertCircle } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>(Role.TEACHER);
  const [classAssigned, setClassAssigned] = useState('1');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(storageService.getUsers());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: editId || `u_${Date.now()}`,
      username,
      password,
      name: fullName,
      role,
      classAssigned: role === Role.TEACHER ? classAssigned : undefined
    };
    storageService.saveUser(newUser);
    loadUsers();
    closeModal();
  };

  const handleEdit = (u: User) => {
    setEditId(u.id);
    setUsername(u.username);
    setPassword(u.password || '');
    setFullName(u.name);
    setRole(u.role);
    setClassAssigned(u.classAssigned || '1');
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  }

  const executeDelete = () => {
    if (deleteId) {
      storageService.deleteUser(deleteId);
      loadUsers();
      setDeleteId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole(Role.TEACHER);
    setClassAssigned('1');
  };

  return (
    <div className="space-y-6 relative">
      {/* Delete Confirmation Modal */}
      {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
                  <div className="flex items-center gap-3 text-red-600 mb-3">
                      <AlertCircle size={24} />
                      <h3 className="text-lg font-bold">Hapus User?</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm">Akun pengguna akan dihapus permanen.</p>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                      <button onClick={executeDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">Ya, Hapus</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Manajemen User</h1>
          <p className="text-slate-500 text-sm">Kelola akun Admin dan Wali Kelas.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Nama Lengkap</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Kelas Ampu</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${u.role === Role.ADMIN ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                    {u.role === Role.ADMIN ? <Shield size={14}/> : <UserIcon size={14}/>}
                  </div>
                  {u.name}
                </td>
                <td className="px-6 py-4 font-mono text-slate-500">{u.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === Role.ADMIN ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.role === Role.TEACHER ? `Kelas ${u.classAssigned}` : '-'}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleEdit(u)} className="text-slate-400 hover:text-primary"><Edit2 size={18}/></button>
                  {u.username !== 'admin' && (
                    <button onClick={() => confirmDelete(u.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editId ? 'Edit User' : 'Tambah User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full border p-2 rounded-lg">
                    <option value={Role.TEACHER}>Wali Kelas (Teacher)</option>
                    <option value={Role.ADMIN}>Admin</option>
                </select>
              </div>
              {role === Role.TEACHER && (
                 <div>
                    <label className="block text-sm font-medium mb-1">Kelas Ampu</label>
                    <select value={classAssigned} onChange={e => setClassAssigned(e.target.value)} className="w-full border p-2 rounded-lg">
                        {[1,2,3,4,5,6].map(c => <option key={c} value={c.toString()}>{c}</option>)}
                    </select>
                 </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
